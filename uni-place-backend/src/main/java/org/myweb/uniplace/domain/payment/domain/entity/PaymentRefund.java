package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_refund")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentRefund {

    public enum RefundSt {
        requested, done, failed
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refund_id")
    private Integer refundId;

    @Column(name = "payment_id", nullable = false)
    private Integer paymentId;

    @Column(name = "refund_price", precision = 12, scale = 0)
    private BigDecimal refundPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_st")
    private RefundSt refundSt; // requested, done, failed

    @Column(name = "refund_reason", length = 255)
    private String refundReason;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public void markDone(LocalDateTime completedAt) {
        this.refundSt = RefundSt.done;
        this.completedAt = completedAt;
    }

    public void markFailed(LocalDateTime completedAt) {
        this.refundSt = RefundSt.failed;
        this.completedAt = completedAt;
    }
}