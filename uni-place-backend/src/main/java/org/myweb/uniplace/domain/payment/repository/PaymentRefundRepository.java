package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.PaymentRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PaymentRefundRepository extends JpaRepository<PaymentRefund, Integer> {

    List<PaymentRefund> findByPaymentId(Integer paymentId);

    Optional<PaymentRefund> findTopByPaymentIdOrderByRefundIdDesc(Integer paymentId);

    List<PaymentRefund> findByPaymentIdAndRefundSt(Integer paymentId, PaymentRefund.RefundSt refundSt);

    @Query("""
        select coalesce(sum(r.refundPrice), 0)
        from PaymentRefund r
        where r.paymentId = :paymentId
          and r.refundSt = :refundSt
    """)
    BigDecimal sumRefundPriceByPaymentIdAndRefundSt(
        @Param("paymentId") Integer paymentId,
        @Param("refundSt") PaymentRefund.RefundSt refundSt
    );
}
