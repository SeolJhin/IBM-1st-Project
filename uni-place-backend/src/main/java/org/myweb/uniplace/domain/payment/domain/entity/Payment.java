package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "payment",
    indexes = {
        @Index(name = "ix_payment_user", columnList = "user_id"),
        @Index(name = "ix_payment_provider", columnList = "provider, provider_payment_id")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Payment {

    private static final String ST_READY = "ready";
    private static final String ST_PAID = "paid";
    private static final String ST_CANCELLED = "cancelled";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Integer paymentId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "service_goods_id", nullable = false)
    private Integer serviceGoodsId;

    @Builder.Default
    @Column(name = "currency", nullable = false, columnDefinition = "CHAR(3)")
    private String currency = "KRW";

    @Column(name = "total_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal totalPrice;

    @Builder.Default
    @Column(name = "captured_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal capturedPrice = BigDecimal.ZERO;

    @Column(name = "payment_method_id")
    private Integer paymentMethodId;

    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "order_type", length = 20)
    private String orderType;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_payment_id", length = 100)
    private String providerPaymentId;

    @Column(name = "tax_scope_price", precision = 12, scale = 0)
    private BigDecimal taxScopePrice;

    @Column(name = "tax_ex_scope_price", precision = 12, scale = 0)
    private BigDecimal taxExScopePrice;

    @Column(name = "tax_free_price", precision = 12, scale = 0)
    private BigDecimal taxFreePrice;

    @Builder.Default
    @Column(name = "payment_st", nullable = false, length = 20)
    private String paymentSt = ST_READY;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public void markPaid(LocalDateTime paidAt, BigDecimal capturedPrice) {
        this.paymentSt = ST_PAID;
        this.paidAt = paidAt;
        if (capturedPrice != null) {
            this.capturedPrice = capturedPrice;
        }
    }

    public void markCanceled() {
        this.paymentSt = ST_CANCELLED;
    }

    public void markReady() {
        this.paymentSt = ST_READY;
    }

    public void updateProviderPaymentId(String providerPaymentId) {
        this.providerPaymentId = providerPaymentId;
    }
}
