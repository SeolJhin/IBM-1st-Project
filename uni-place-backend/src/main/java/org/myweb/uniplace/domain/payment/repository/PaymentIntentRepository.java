package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentIntentRepository extends JpaRepository<PaymentIntent, Long> {

    Optional<PaymentIntent> findTopByPaymentIdOrderByPaymentIntentIdDesc(Integer paymentId);

    Optional<PaymentIntent> findByPaymentIdAndProviderRefId(Integer paymentId, String providerRefId);

    List<PaymentIntent> findByPaymentIdAndIntentSt(Integer paymentId, PaymentIntentStatus intentSt);

    Optional<PaymentIntent> findTopByProviderRefIdOrderByPaymentIntentIdDesc(String providerRefId);
}