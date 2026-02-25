package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    List<Payment> findAllByUserIdOrderByPaymentIdDesc(String userId);

    List<Payment> findAllByPaymentStOrderByPaymentIdDesc(String paymentSt);

    Optional<Payment> findByProviderAndProviderPaymentId(String provider, String providerPaymentId);

    Optional<Payment> findByMerchantUid(String merchantUid);

    Optional<Payment> findTopByUserIdAndIdempotencyKeyOrderByPaymentIdDesc(String userId, String idempotencyKey);

    Optional<Payment> findTopByUserIdAndTargetTypeAndTargetIdAndPaymentStInOrderByPaymentIdDesc(
        String userId,
        String targetType,
        Integer targetId,
        List<String> paymentSt
    );

    List<Payment> findTop200ByPaymentStInOrderByPaymentIdAsc(List<String> paymentSt);
}
