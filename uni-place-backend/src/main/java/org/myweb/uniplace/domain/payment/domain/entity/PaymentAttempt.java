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

    public enum AttemptSt {
        requested, approved, failed
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attempt_id")
    private Integer attemptId;

    @Column(name = "payment_id", nullable = false)
    private Integer paymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "attempt_st", nullable = false)
    private AttemptSt attemptSt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    public void approve(LocalDateTime finishedAt) {
        this.attemptSt = AttemptSt.approved;
        this.finishedAt = finishedAt;
    }

    public void fail(LocalDateTime finishedAt) {
        this.attemptSt = AttemptSt.failed;
        this.finishedAt = finishedAt;
    }
}