package org.myweb.uniplace.domain.payment.application.gateway.exception;

import lombok.Getter;

@Getter
public class PaymentGatewayException extends RuntimeException {

    private final String provider;
    private final String gateway_error_code;
    private final String raw_body;

    public PaymentGatewayException(String provider, String gateway_error_code, String message, String raw_body) {
        super(message);
        this.provider = provider;
        this.gateway_error_code = gateway_error_code;
        this.raw_body = raw_body;
    }

    public PaymentGatewayException(String provider, String message, Throwable cause) {
        super(message, cause);
        this.provider = provider;
        this.gateway_error_code = null;
        this.raw_body = null;
    }
}