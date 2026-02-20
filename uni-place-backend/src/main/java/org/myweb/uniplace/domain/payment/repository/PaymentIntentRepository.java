package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentIntentRepository extends JpaRepository<PaymentIntent, Long> {

    // payment_id로 최신 인텐트 조회(prepare → approve 플로우에서 가장 많이 씀)
    Optional<PaymentIntent> findTopByPaymentIdOrderByPaymentIntentIdDesc(Integer paymentId);

    // (payment_id, provider_ref_id) 유니크라서 정확히 1건 조회 가능
    Optional<PaymentIntent> findByPaymentIdAndProviderRefId(Integer paymentId, String providerRefId);

    // 상태별로 모니터링/정리할 때 사용
    List<PaymentIntent> findAllByPaymentIdAndIntentSt(Integer paymentId, PaymentIntentStatus intentSt);
}