package org.myweb.uniplace.domain.payment.application.gateway;

import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class PaymentGatewayFactory {

    private final List<PaymentGateway> paymentGateways;

    public PaymentGatewayFactory(List<PaymentGateway> paymentGateways) {
        this.paymentGateways = paymentGateways;
    }

    public PaymentGateway get(String provider) {
        if (provider == null || provider.isBlank()) {
            throw new IllegalArgumentException("provider is required");
        }
        return paymentGateways.stream()
            .filter(gw -> provider.equalsIgnoreCase(gw.provider()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unsupported provider: " + provider));
    }
}