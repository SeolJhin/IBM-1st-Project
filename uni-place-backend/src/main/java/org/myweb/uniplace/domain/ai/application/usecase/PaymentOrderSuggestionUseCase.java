package org.myweb.uniplace.domain.ai.application.usecase;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductWithBuildingStockResponse;
import org.myweb.uniplace.domain.commerce.application.ProductService;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentOrderSuggestionUseCase extends AbstractForwardUseCase {

    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final ProductService productService;
    private final PaymentRepository paymentRepository;
    private final BuildingRepository buildingRepository;

    public PaymentOrderSuggestionUseCase(
        AiGateway aiGateway,
        ProductService productService,
        PaymentRepository paymentRepository,
        BuildingRepository buildingRepository
    ) {
        super(aiGateway);
        this.productService = productService;
        this.paymentRepository = paymentRepository;
        this.buildingRepository = buildingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        String userId = firstNonBlank(request.getUserId(), stringSlot(slots, "userId", "user_id"));
        Integer buildingId = intSlot(slots, "buildingId", "building_id");
        YearMonth month = parseYearMonth(firstNonBlank(stringSlot(slots, "month"), currentMonthText()));

        if (!hasSlot(slots, "month")) {
            slots.put("month", month != null ? month.toString() : currentMonthText());
        }
        if (!hasSlot(slots, "items")) {
            slots.put("items", loadOrderItems(userId, buildingId, month));
        }

        // 빌딩 정보 주입
        if (buildingId != null && !hasSlot(slots, "building_nm")) {
            buildingRepository.findById(buildingId).ifPresent(b -> {
                slots.put("building_nm", b.getBuildingNm());
                slots.put("building_addr", b.getBuildingAddr());
                slots.put("lessor_nm", b.getBuildingLessorNm());
                slots.put("lessor_tel", b.getBuildingLessorTel());
            });
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
        return AiIntent.PAYMENT_ORDER_SUGGESTION;
    }

    private List<Map<String, Object>> loadOrderItems(String userId, Integer buildingId, YearMonth month) {
        BigDecimal monthlyPaidTotal = sumMonthlyPaid(userId, month);
        List<Map<String, Object>> items = new ArrayList<>();
        List<ProductWithBuildingStockResponse> products = productService.getAllOnSaleProductsWithBuildingStocks();
        for (ProductWithBuildingStockResponse product : products) {
            if (product.getBuildingStocks() == null || product.getBuildingStocks().isEmpty()) {
                continue;
            }
            for (Map.Entry<Integer, Integer> stock : product.getBuildingStocks().entrySet()) {
                Integer currentBuildingId = stock.getKey();
                if (buildingId != null && !buildingId.equals(currentBuildingId)) {
                    continue;
                }
                Map<String, Object> item = new HashMap<>();
                item.put("building_id", currentBuildingId);
                item.put("prod_id", product.getProdId());
                item.put("prod_nm", product.getProdNm());
                item.put("prod_price", product.getProdPrice() != null ? product.getProdPrice().intValue() : 0);
                item.put("prod_stock", stock.getValue());
                item.put("affiliate_id", product.getAffiliateId());
                item.put("paid_amount", monthlyPaidTotal.intValue());
                items.add(item);
            }
        }
        return items;
    }

    private BigDecimal sumMonthlyPaid(String userId, YearMonth month) {
        if (userId == null || userId.isBlank()) {
            return BigDecimal.ZERO;
        }
        List<Payment> payments = paymentRepository.findAllByUserIdOrderByPaymentIdDesc(userId);
        return payments.stream()
            .filter(payment -> "paid".equalsIgnoreCase(payment.getPaymentSt()))
            .filter(payment -> payment.getPaidAt() != null)
            .filter(payment -> month == null || YearMonth.from(payment.getPaidAt()).equals(month))
            .map(Payment::getTotalPrice)
            .filter(value -> value != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
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

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String currentMonthText() {
        return YEAR_MONTH_FMT.format(LocalDateTime.now());
    }
}
