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
        name = "monthly_charge",
        indexes = {
                @Index(name = "ix_monthly_charge_contract", columnList = "contract_id"),
                @Index(name = "ix_monthly_charge_billing", columnList = "billing_dt")
        }
)
public class MonthlyCharge {

    public static final String ST_UNPAID = "unpaid";
    public static final String ST_PAID = "paid";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "charge_id")
    private Integer chargeId;

    @Column(name = "contract_id", nullable = false)
    private Integer contractId;

    @Column(name = "charge_type", nullable = false, length = 30)
    private String chargeType;

    @Column(name = "billing_dt", nullable = false, length = 7)
    private String billingDt;

    @Column(name = "price", nullable = false, precision = 12, scale = 0)
    private BigDecimal price;

    @Builder.Default
    @Column(name = "charge_st", nullable = false, length = 20)
    private String chargeSt = ST_UNPAID;

    @Column(name = "payment_id")
    private Integer paymentId;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (chargeSt == null || chargeSt.isBlank()) chargeSt = ST_UNPAID;
    }

    public void markPaid(Integer paymentId) {
        this.chargeSt = ST_PAID;
        if (paymentId != null) this.paymentId = paymentId;
    }

    public void markUnpaid() {
        this.chargeSt = ST_UNPAID;
        this.paymentId = null;
    }
}
