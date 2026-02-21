package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.PaymentRefund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRefundRepository extends JpaRepository<PaymentRefund, Integer> {

    List<PaymentRefund> findByPaymentId(Integer paymentId);

    Optional<PaymentRefund> findTopByPaymentIdOrderByRefundIdDesc(Integer paymentId);

    List<PaymentRefund> findByPaymentIdAndRefundSt(Integer paymentId, PaymentRefund.RefundSt refundSt);
}