package org.myweb.uniplace.domain.payment.application.query;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentQueryServiceImpl implements PaymentQueryService {

    private final PaymentRepository paymentRepository;

    @Override
    public List<Payment> getPaymentsByUserId(String userId) {
        return paymentRepository.findAllByUserIdOrderByPaymentIdDesc(userId);
    }

    @Override
    public List<Payment> getPaymentsByPaymentSt(String paymentSt) {
        return paymentRepository.findAllByPaymentStOrderByPaymentIdDesc(paymentSt);
    }

    @Override
    public Optional<Payment> getPaymentByProviderAndProviderPaymentId(String provider, String providerPaymentId) {
        if (provider == null || provider.isBlank() || providerPaymentId == null || providerPaymentId.isBlank()) {
            return Optional.empty();
        }
        return paymentRepository.findByProviderAndProviderPaymentId(provider, providerPaymentId);
    }

    @Override
    public Optional<Payment> getPaymentByPaymentId(Integer paymentId) {
        if (paymentId == null) return Optional.empty();
        return paymentRepository.findById(paymentId);
    }
}