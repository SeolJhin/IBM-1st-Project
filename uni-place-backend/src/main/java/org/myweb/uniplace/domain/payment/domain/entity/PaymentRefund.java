package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "payment_refund")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentRefund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refund_id")
    private Integer refundId;

    @Column(name = "payment_id", nullable = false)
    private Integer paymentId;

    @Column(name = "refund_price")
    private BigDecimal refundPrice;

    @Column(name = "refund_st", length = 20)
    private String refundStatus; // requested, done, failed

    @Column(name = "refund_reason")
    private String refundReason;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public void markDone(LocalDateTime completedAt) {
        this.refundStatus = "done";
        this.completedAt = completedAt;
    }

    public void markFailed() {
        this.refundStatus = "failed";
    }
}