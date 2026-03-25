package org.myweb.uniplace.domain.payment.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.entity.OrderItem;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class MyPaymentResponse {

    private Integer paymentId;
    private String  targetType;
    private Integer targetId;
    private BigDecimal totalPrice;
    private BigDecimal capturedPrice;
    private String  paymentSt;
    private String  provider;
    private String  merchantUid;
    private String  providerPaymentId;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;

    /** targetType = "order" 일 때만 채워짐 */
    private List<OrderItemInfo> orderItems;

    // ── 주문 상품 정보 ─────────────────────────────────────────
    @Getter
    @Builder
    public static class OrderItemInfo {
        private String  productName;
        private Integer quantity;
        private BigDecimal price;

        public static OrderItemInfo from(OrderItem oi) {
            return OrderItemInfo.builder()
                    .productName(oi.getProduct() != null ? oi.getProduct().getProdNm() : "-")
                    .quantity(oi.getOrderQuantity())
                    .price(oi.getOrderPrice())
                    .build();
        }
    }

    // ── 기본 변환 (orderItems 없음) ────────────────────────────
    public static MyPaymentResponse from(Payment p) {
        return from(p, null);
    }

    // ── 룸서비스 주문 포함 변환 ────────────────────────────────
    public static MyPaymentResponse from(Payment p, Order order) {
        List<OrderItemInfo> items = order == null
                ? Collections.emptyList()
                : order.getOrderItems().stream()
                        .map(OrderItemInfo::from)
                        .collect(Collectors.toList());

        // createdAt: payment 생성시간 → 주문 생성시간 → 결제시간 순으로 fallback
        LocalDateTime created = p.getCreatedAt();
        if (created == null && order != null) {
            created = order.getOrderCreatedAt();
        }
        if (created == null) {
            created = p.getPaidAt();
        }

        return builder()
                .paymentId(p.getPaymentId())
                .targetType(p.getTargetType())
                .targetId(p.getTargetId())
                .totalPrice(p.getTotalPrice())
                .capturedPrice(p.getCapturedPrice())
                .paymentSt(p.getPaymentSt())
                .provider(p.getProvider())
                .merchantUid(p.getMerchantUid())
                .providerPaymentId(p.getProviderPaymentId())
                .paidAt(p.getPaidAt())
                .createdAt(created)
                .orderItems(items)
                .build();
    }
}
