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
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentStatusUseCase extends AbstractForwardUseCase {

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final PaymentRepository paymentRepository;

    public PaymentStatusUseCase(AiGateway aiGateway, PaymentRepository paymentRepository) {
        super(aiGateway);
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        String userId = firstNonBlank(request.getUserId(), stringSlot(slots, "userId", "user_id"));
        String paymentStatus = firstNonBlank(stringSlot(slots, "paymentSt", "payment_st"), "paid");
        YearMonth billingMonth = parseYearMonth(firstNonBlank(stringSlot(slots, "billingMonth", "month"), stringSlot(slots, "billing_month")));

        List<Payment> history = loadPayments(userId, paymentStatus, billingMonth);
        if (history.isEmpty()) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }

        Payment latest = history.get(0);
        if (!hasSlot(slots, "items")) {
            slots.put("items", toItems(history));
        }
        putIfMissing(slots, "paymentSt", latest.getPaymentSt(), "payment_st");
        putIfMissing(slots, "billingMonth", latest.getPaidAt() != null ? YEAR_MONTH_FMT.format(latest.getPaidAt()) : null, "billing_month");
        putIfMissing(slots, "chargeStatus", chargeStatusFrom(latest.getPaymentSt()), "charge_status");
        putIfMissing(slots, "dueDate", latest.getPaidAt() != null ? latest.getPaidAt().toLocalDate().toString() : null, "due_date");

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
        return AiIntent.PAYMENT_STATUS_SUMMARY;
    }

    private List<Payment> loadPayments(String userId, String paymentStatus, YearMonth month) {
        List<Payment> base = (userId != null && !userId.isBlank())
            ? paymentRepository.findAllByUserIdOrderByPaymentIdDesc(userId)
            : paymentRepository.findAllByPaymentStOrderByPaymentIdDesc(paymentStatus);

        return base.stream()
            .filter(payment -> paymentStatus == null || paymentStatus.equalsIgnoreCase(payment.getPaymentSt()))
            .filter(payment -> month == null || (payment.getPaidAt() != null && YearMonth.from(payment.getPaidAt()).equals(month)))
            .limit(20)
            .toList();
    }

    private List<Map<String, Object>> toItems(List<Payment> payments) {
        return payments.stream().map(payment -> {
            Map<String, Object> item = new HashMap<>();
            item.put("payment_id", payment.getPaymentId());
            item.put("payment_st", payment.getPaymentSt());
            item.put("billing_month", payment.getPaidAt() != null ? YEAR_MONTH_FMT.format(payment.getPaidAt()) : null);
            item.put("charge_status", chargeStatusFrom(payment.getPaymentSt()));
            item.put("due_date", payment.getPaidAt() != null ? payment.getPaidAt().toLocalDate().toString() : null);
            item.put("paid_at", payment.getPaidAt() != null ? DATE_TIME_FMT.format(payment.getPaidAt()) : null);
            item.put("total_price", payment.getTotalPrice() != null ? payment.getTotalPrice().intValue() : null);
            return item;
        }).toList();
    }

    private String chargeStatusFrom(String paymentStatus) {
        if (paymentStatus == null) {
            return "UNKNOWN";
        }
        if ("paid".equalsIgnoreCase(paymentStatus)) {
            return "PAID";
        }
        if ("ready".equalsIgnoreCase(paymentStatus) || "pending".equalsIgnoreCase(paymentStatus)) {
            return "UNPAID";
        }
        if ("cancelled".equalsIgnoreCase(paymentStatus)) {
            return "CANCELLED";
        }
        return paymentStatus.toUpperCase();
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
