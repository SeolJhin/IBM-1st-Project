package org.myweb.uniplace.domain.payment.application.query;

import org.myweb.uniplace.domain.payment.domain.entity.Payment;

import java.util.List;
import java.util.Optional;

public interface PaymentQueryService {

    List<Payment> getPaymentsByUserId(String userId);

    List<Payment> getPaymentsByPaymentSt(String paymentSt);

    Optional<Payment> getPaymentByProviderAndProviderPaymentId(String provider, String providerPaymentId);

    Optional<Payment> getPaymentByPaymentId(Integer paymentId);
}