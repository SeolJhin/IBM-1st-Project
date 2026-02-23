package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.PaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Integer> {

    List<PaymentAttempt> findByPaymentId(Integer paymentId);

    PaymentAttempt findTopByPaymentIdOrderByAttemptIdDesc(Integer paymentId);

    long countByPaymentIdAndAttemptSt(Integer paymentId, PaymentAttempt.AttemptSt attemptSt);
}
