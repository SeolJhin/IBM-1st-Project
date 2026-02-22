package org.myweb.uniplace.domain.payment.application;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntentStatus;
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import org.myweb.uniplace.domain.payment.application.gateway.PaymentGateway;
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGatewayFactory;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyResponse;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveResponse;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final String ST_READY = "ready";
    private static final String ST_PAID = "paid";

    private final PaymentRepository paymentRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentGatewayFactory paymentGatewayFactory;

    @Value("${app.baseUrl:http://localhost:8080}")
    private String appBaseUrl;

    @Override
    public PaymentPrepareResponse prepare(PaymentPrepareRequest request) {

        BigDecimal totalPrice = request.getAmount();

        Payment payment = Payment.builder()
            .userId(request.getUserId())
            .serviceGoodsId(request.getServiceGoodsId())
            .currency("KRW")
            .totalPrice(totalPrice)
            .capturedPrice(BigDecimal.ZERO)
            .paymentMethodId(request.getPaymentMethodId())
            .provider(request.getProvider())
            .paymentSt(ST_READY)
            .build();

        paymentRepository.save(payment);

        String providerSlug = payment.getProvider() == null ? "kakao" : payment.getProvider().toLowerCase();
        String approvalUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/approval?pid=" + payment.getPaymentId();
        String cancelUrl   = appBaseUrl + "/api/payments/callback/" + providerSlug + "/cancel?pid=" + payment.getPaymentId();
        String failUrl     = appBaseUrl + "/api/payments/callback/" + providerSlug + "/fail?pid=" + payment.getPaymentId();

        PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());

        PaymentGatewayReadyResponse gwRes = gateway.ready(
            PaymentGatewayReadyRequest.builder()
                .paymentId(payment.getPaymentId())
                .userId(payment.getUserId())
                .orderId(String.valueOf(payment.getPaymentId()))
                .itemName("uni-place")
                .quantity(1)
                .totalPrice(totalPrice)
                .taxFreePrice(BigDecimal.ZERO)
                .approvalUrl(approvalUrl)
                .cancelUrl(cancelUrl)
                .failUrl(failUrl)
                .build()
        );

        PaymentIntent intent = PaymentIntent.builder()
            .paymentId(payment.getPaymentId())
            .intentSt(PaymentIntentStatus.READY_OK)
            .providerRefId(gwRes.getProviderRefId())
            .appSchemeUrl(gwRes.getRedirectAppUrl())
            .returnUrl(approvalUrl)
            .pgReadyJson(gwRes.getPgReadyJson())
            .build();

        paymentIntentRepository.save(intent);

        return PaymentPrepareResponse.builder()
            .paymentId(payment.getPaymentId())
            .paymentSt(ST_READY)
            .providerRefId(gwRes.getProviderRefId())
            .redirectPcUrl(gwRes.getRedirectPcUrl())
            .redirectMobileUrl(gwRes.getRedirectMobileUrl())
            .redirectAppUrl(gwRes.getRedirectAppUrl())
            .build();
    }

    @Override
    public PaymentResponse approve(PaymentApproveRequest request) {

        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        PaymentIntent intent = paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(payment.getPaymentId())
            .orElseThrow(() -> new IllegalArgumentException("PaymentIntent not found"));

        PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());

        PaymentGatewayApproveResponse gwRes = gateway.approve(
            PaymentGatewayApproveRequest.builder()
                .paymentId(payment.getPaymentId())
                .userId(payment.getUserId())
                .providerRefId(intent.getProviderRefId())
                .pgToken(request.getPgToken())
                .paymentKey(request.getPaymentKey())
                .orderId(String.valueOf(payment.getPaymentId()))
                .amount(payment.getTotalPrice())
                .build()
        );

        intent.markApproveOk(gwRes.getPgApproveJson());
        paymentIntentRepository.save(intent);

        String providerPaymentId =
            (gwRes.getProviderPaymentId() != null && !gwRes.getProviderPaymentId().isBlank())
                ? gwRes.getProviderPaymentId()
                : intent.getProviderRefId();

        payment.updateProviderPaymentId(providerPaymentId);

        payment.markPaid(LocalDateTime.now(), payment.getTotalPrice());
        paymentRepository.save(payment);

        return PaymentResponse.builder()
            .paymentId(payment.getPaymentId())
            .paymentSt(ST_PAID)
            .paidAt(payment.getPaidAt())
            .build();
    }

    @Override
    public PaymentResponse retry(Integer paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        payment.markReady();
        paymentRepository.save(payment);

        return PaymentResponse.builder()
            .paymentId(payment.getPaymentId())
            .paymentSt(payment.getPaymentSt())
            .build();
    }
}
