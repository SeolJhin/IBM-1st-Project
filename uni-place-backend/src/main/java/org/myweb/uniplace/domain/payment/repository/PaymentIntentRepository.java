package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentIntentRepository extends JpaRepository<PaymentIntent, Long> {

    // payment_id로 최신 인텐트 조회(prepare → approve 플로우에서 가장 많이 씀)
    Optional<PaymentIntent> findTopByPaymentIdOrderByPaymentIntentIdDesc(Integer paymentId);

    // (payment_id, provider_ref_id)로 조회 (providerRefId는 null이면 안 됨: 서비스에서 보장 권장)
    Optional<PaymentIntent> findByPaymentIdAndProviderRefId(Integer paymentId, String providerRefId);

    // 상태별 조회
    List<PaymentIntent> findByPaymentIdAndIntentSt(Integer paymentId, PaymentIntentStatus intentSt);

    // providerRefId 단독 조회: PG webhook에서 provider_ref_id만 주는 케이스 대비
    Optional<PaymentIntent> findTopByProviderRefIdOrderByPaymentIntentIdDesc(String providerRefId);
}