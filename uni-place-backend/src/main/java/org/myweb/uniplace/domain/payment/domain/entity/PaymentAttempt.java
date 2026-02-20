package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_attempt")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attempt_id")
    private Integer attemptId;

    @Column(name = "payment_id", nullable = false)
    private Integer paymentId;

    @Column(name = "attempt_st", nullable = false, length = 20)
    private String attemptStatus; // requested, approved, failed

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    public void approve(LocalDateTime finishedAt) {
        this.attemptStatus = "approved";
        this.finishedAt = finishedAt;
    }

    public void fail(LocalDateTime finishedAt) {
        this.attemptStatus = "failed";
        this.finishedAt = finishedAt;
    }
}