package org.myweb.uniplace.domain.payment.application;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.billing.application.BillingOrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

//추가 import
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGateway;
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGatewayFactory;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyResponse;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveResponse;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntentStatus;
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final String ST_READY = "ready";
    private static final String ST_PAID = "paid";
    private static final String ORDER_TYPE_BILLING = "BILLING";

    private final PaymentRepository paymentRepository;
    

    private final PaymentIntentRepository paymentIntentRepository;

    private final BillingOrderService billingOrderService;

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
            .orderId(request.getOrderId())
            .orderType(request.getOrderType())
            .provider(request.getProvider())
            .paymentSt(ST_READY)
            .build();

        paymentRepository.save(payment);

        // ✅ 프론트 미정: 임시 콜백 URL(백엔드) 생성
        String approvalUrl = appBaseUrl + "/api/payments/callback/kakao/approval?paymentId=" + payment.getPaymentId();
        String cancelUrl   = appBaseUrl + "/api/payments/callback/kakao/cancel?paymentId=" + payment.getPaymentId();
        String failUrl     = appBaseUrl + "/api/payments/callback/kakao/fail?paymentId=" + payment.getPaymentId();

        // ✅ gateway 호출
        PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());

        PaymentGatewayReadyResponse gwRes = gateway.ready(
            PaymentGatewayReadyRequest.builder()
                .paymentId(payment.getPaymentId())
                .userId(payment.getUserId())
                .itemName("uni-place") // TODO: 추후 service_goods_nm 조회해서 넣어도 됨
                .quantity(1)
                .totalPrice(totalPrice)
                .taxFreePrice(BigDecimal.ZERO)
                .approvalUrl(approvalUrl)
                .cancelUrl(cancelUrl)
                .failUrl(failUrl)
                .build()
        );

        //  payment_intent 저장 (DB 기준)
        PaymentIntent intent = PaymentIntent.builder()
            .paymentId(payment.getPaymentId())
            .intentSt(PaymentIntentStatus.READY_OK)
            .providerRefId(gwRes.getProviderRefId())      // = tid 저장
            .appSchemeUrl(gwRes.getRedirectAppUrl())
            .returnUrl(approvalUrl)                       // DB 컬럼 return_url (임시로 approvalUrl 저장)
            .pgReadyJson(gwRes.getPgReadyJson())          // 원문 JSON 저장
            .build();

        paymentIntentRepository.save(intent);

        //  응답에 redirect URL 포함
        return PaymentPrepareResponse.builder()
            .paymentId(payment.getPaymentId())
            .paymentSt(ST_READY)
            .providerRefId(gwRes.getProviderRefId())
            .redirectPcUrl(gwRes.getRedirectPcUrl())
            .redirectMobileUrl(gwRes.getRedirectMobileUrl())
            .redirectAppUrl(gwRes.getRedirectAppUrl())
            .build();
    }
// ----------------------------------------------------------- prepare()
    
    
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
                .providerRefId(intent.getProviderRefId())   // tid
                .pgToken(request.getPgToken())              
                .build()
        );

        //  payment_intent 업데이트 (pg_approve_json 저장 + 상태 변경)
        intent.markApproveOk(gwRes.getPgApproveJson());
        paymentIntentRepository.save(intent);

        //  payment.provider_payment_id 저장: approve 응답 우선, 없으면 tid fallback
        String providerPaymentId =
            (gwRes.getProviderPaymentId() != null && !gwRes.getProviderPaymentId().isBlank())
                ? gwRes.getProviderPaymentId()
                : intent.getProviderRefId();

        payment.updateProviderPaymentId(providerPaymentId);

        //  paid 처리
        payment.markPaid(LocalDateTime.now(), payment.getTotalPrice());
        paymentRepository.save(payment);

        if (ORDER_TYPE_BILLING.equalsIgnoreCase(payment.getOrderType())
                && payment.getOrderId() != null) {
            billingOrderService.markPaid(payment.getOrderId(), payment.getPaymentId());
        }

        return PaymentResponse.builder()
            .paymentId(payment.getPaymentId())
            .paymentSt(ST_PAID)
            .paidAt(payment.getPaidAt())
            .build();
    }
// ------------------------------------------------------------ approve()
    

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
