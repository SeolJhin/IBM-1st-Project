package org.myweb.uniplace.domain.ai.application.usecase;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.ServiceGoods;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.payment.repository.ServiceGoodsRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentSummaryUseCase extends AbstractForwardUseCase {

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final PaymentRepository paymentRepository;
    private final ServiceGoodsRepository serviceGoodsRepository;

    public PaymentSummaryUseCase(
        AiGateway aiGateway,
        PaymentRepository paymentRepository,
        ServiceGoodsRepository serviceGoodsRepository
    ) {
        super(aiGateway);
        this.paymentRepository = paymentRepository;
        this.serviceGoodsRepository = serviceGoodsRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        String userId = firstNonBlank(request.getUserId(), stringSlot(slots, "userId", "user_id"));
        Integer paymentId = intSlot(slots, "paymentId", "payment_id");
        YearMonth billingMonth = parseYearMonth(firstNonBlank(stringSlot(slots, "month"), stringSlot(slots, "billingMonth")));

        Payment payment = resolveTargetPayment(userId, paymentId, billingMonth);
        if (payment == null) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }

        fillPaymentSlots(slots, payment);
        if (userId != null && !userId.isBlank() && !hasSlot(slots, "items")) {
            slots.put("items", toHistoryItems(userId));
        }

        AiGatewayRequest enrichedRequest = AiGatewayRequest.builder()
            .intent(request.getIntent())
            .userId(request.getUserId())
            .userSegment(request.getUserSegment())
            .prompt(request.getPrompt())
            .slots(slots)
            .build();
        return super.execute(enrichedRequest);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.PAYMENT_SUMMARY_DOCUMENT;
    }

    private Payment resolveTargetPayment(String userId, Integer paymentId, YearMonth month) {
        if (paymentId != null) {
            Payment payment = paymentRepository.findById(paymentId).orElse(null);
            if (payment == null) {
                return null;
            }
            if (userId == null || userId.isBlank() || userId.equals(payment.getUserId())) {
                return payment;
            }
            return null;
        }
        if (userId == null || userId.isBlank()) {
            return null;
        }

        List<Payment> payments = paymentRepository.findAllByUserIdOrderByPaymentIdDesc(userId);
        if (payments.isEmpty()) {
            return null;
        }

        if (month == null) {
            return payments.get(0);
        }
        return payments.stream()
            .filter(payment -> payment.getPaidAt() != null && YearMonth.from(payment.getPaidAt()).equals(month))
            .findFirst()
            .orElse(payments.get(0));
    }

    private void fillPaymentSlots(Map<String, Object> slots, Payment payment) {
        putIfMissing(slots, "paymentId", payment.getPaymentId(), "payment_id");
        putIfMissing(slots, "totalPrice", payment.getTotalPrice() != null ? payment.getTotalPrice().intValue() : null, "total_price");
        putIfMissing(slots, "paidAt", payment.getPaidAt() != null ? DATE_TIME_FMT.format(payment.getPaidAt()) : null, "paid_at");
        putIfMissing(slots, "paymentSt", payment.getPaymentSt(), "payment_st");
        putIfMissing(slots, "targetType", payment.getTargetType(), "target_type");
        putIfMissing(slots, "month", payment.getPaidAt() != null ? YEAR_MONTH_FMT.format(payment.getPaidAt()) : null, "billing_month");

        ServiceGoods serviceGoods = serviceGoodsRepository.findById(payment.getServiceGoodsId()).orElse(null);
        if (serviceGoods != null) {
            putIfMissing(slots, "serviceGoodsNm", serviceGoods.getServiceGoodsNm(), "service_goods_nm");
        }
    }

    private List<Map<String, Object>> toHistoryItems(String userId) {
        return paymentRepository.findAllByUserIdOrderByPaymentIdDesc(userId).stream()
            .limit(10)
            .map(payment -> {
                Map<String, Object> item = new HashMap<>();
                item.put("payment_id", payment.getPaymentId());
                item.put("payment_st", payment.getPaymentSt());
                item.put("total_price", payment.getTotalPrice() != null ? payment.getTotalPrice().intValue() : null);
                item.put("paid_at", payment.getPaidAt() != null ? DATE_TIME_FMT.format(payment.getPaidAt()) : null);
                item.put("target_type", payment.getTargetType());
                item.put("target_id", payment.getTargetId());
                item.put("service_goods_id", payment.getServiceGoodsId());
                return item;
            })
            .toList();
    }

    private Integer intSlot(Map<String, Object> slots, String... keys) {
        Object value = slotValue(slots, keys);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String stringSlot(Map<String, Object> slots, String... keys) {
        Object value = slotValue(slots, keys);
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Object slotValue(Map<String, Object> slots, String... keys) {
        for (String key : keys) {
            if (slots.containsKey(key)) {
                return slots.get(key);
            }
        }
        return null;
    }

    private boolean hasSlot(Map<String, Object> slots, String key) {
        return slots.containsKey(key) && slots.get(key) != null;
    }

    private void putIfMissing(Map<String, Object> slots, String key, Object value, String... aliases) {
        if (value == null) {
            return;
        }
        if (hasSlot(slots, key)) {
            return;
        }
        for (String alias : aliases) {
            if (hasSlot(slots, alias)) {
                return;
            }
        }
        slots.put(key, value);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private YearMonth parseYearMonth(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String text = value.trim();
        if (text.length() >= 7) {
            text = text.substring(0, 7);
        }
        try {
            return YearMonth.parse(text, YEAR_MONTH_FMT);
        } catch (Exception e) {
            return null;
        }
    }
}
