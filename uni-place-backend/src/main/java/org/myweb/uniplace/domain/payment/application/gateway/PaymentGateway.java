package org.myweb.uniplace.domain.payment.application.gateway;

import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyResponse;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayRefundRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayRefundResponse;

public interface PaymentGateway {

    /**
     * payment.provider 값과 동일하게 맞출 것 (예: "KAKAO")
     */
    String provider();

    PaymentGatewayReadyResponse ready(PaymentGatewayReadyRequest request);

    PaymentGatewayApproveResponse approve(PaymentGatewayApproveRequest request);

    PaymentGatewayRefundResponse refund(PaymentGatewayRefundRequest request);
}