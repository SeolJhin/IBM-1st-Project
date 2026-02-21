package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    // 사용자 결제 목록 조회(마이페이지/관리자)
    List<Payment> findAllByUserIdOrderByPaymentIdDesc(String userId);

    // 결제 상태로 조회(운영/배치/관리자)
    List<Payment> findAllByPaymentStOrderByPaymentIdDesc(String paymentSt);

    // PG 결제건 조회(웹훅/승인/취소 시 provider+provider_payment_id가 가장 흔한 식별자)
    Optional<Payment> findByProviderAndProviderPaymentId(String provider, String providerPaymentId);

    // provider_payment_id가 아직 없을 수 있으니(READY 전) payment_id로 로직 진행하는 게 기본
    // -> 그래서 payment_id 기반 기본 CRUD만으로도 충분함
    
    //  웹훅 payload에 provider_payment_id만 있는 경우 대비
    Optional<Payment> findTopByProviderPaymentIdOrderByPaymentIdDesc(String providerPaymentId);
}