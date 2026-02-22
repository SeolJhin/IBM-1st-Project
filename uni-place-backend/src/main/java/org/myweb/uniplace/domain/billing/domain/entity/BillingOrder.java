package org.myweb.uniplace.domain.billing.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "billing_order",
        indexes = {
                @Index(name = "ix_billing_order_contract", columnList = "contract_id"),
                @Index(name = "ix_billing_order_charge", columnList = "charge_id")
        }
)
public class BillingOrder {

    public static final String ST_CREATED = "created";
    public static final String ST_PAID = "paid";
    public static final String ST_CANCELLED = "cancelled";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "contract_id", nullable = false)
    private Integer contractId;

    @Column(name = "charge_id", nullable = false)
    private Integer chargeId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 0)
    private BigDecimal amount;

    @Builder.Default
    @Column(name = "order_st", nullable = false, length = 20)
    private String orderSt = ST_CREATED;

    @Column(name = "payment_id")
    private Integer paymentId;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (orderSt == null || orderSt.isBlank()) orderSt = ST_CREATED;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void markPaid(Integer paymentId) {
        this.orderSt = ST_PAID;
        if (paymentId != null) this.paymentId = paymentId;
    }

    public void markCancelled() {
        this.orderSt = ST_CANCELLED;
    }
}
