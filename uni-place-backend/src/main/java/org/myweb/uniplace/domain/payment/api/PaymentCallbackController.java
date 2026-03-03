package org.myweb.uniplace.domain.payment.api;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.application.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/callback")
@RequiredArgsConstructor
public class PaymentCallbackController {

    private static final Logger log = LoggerFactory.getLogger(PaymentCallbackController.class);

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @GetMapping("/{provider}/approval")
    public PaymentResponse approval(
        @PathVariable("provider") String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam("mu") String merchantUid,
        @RequestParam(value = "pg_token", required = false) String pgToken,
        @RequestParam(value = "paymentId", required = false) String naverPaymentId,
        @RequestParam(value = "paymentKey", required = false) String paymentKey,
        @RequestParam(value = "orderId", required = false) String orderId,
        @RequestParam(value = "amount", required = false) BigDecimal amount
    ) {
        log.info("[PAYMENT_CALLBACK][APPROVAL] provider={}, pid={}, mu={}", provider, paymentId, merchantUid);
        paymentService.recordReturnedParams(paymentId, toCallbackParamsJson(
            provider, paymentId, merchantUid, pgToken, naverPaymentId, paymentKey, orderId, amount
        ));

        PaymentApproveRequest req = new PaymentApproveRequest();
        req.setPaymentId(paymentId);
        req.setMerchantUid(merchantUid);

        if ("naver".equalsIgnoreCase(provider)) {
            req.setPgToken(naverPaymentId);
        } else {
            req.setPgToken(pgToken);
        }

        if ("toss".equalsIgnoreCase(provider)) {
            req.setPaymentKey(paymentKey);
        }

        PaymentResponse response = paymentService.approveFromCallback(req);
        log.info("[PAYMENT_CALLBACK][APPROVAL_OK] provider={}, pid={}, st={}",
            provider,
            response != null ? response.getPaymentId() : null,
            response != null ? response.getPaymentSt() : null
        );
        return response;
    }

    @GetMapping("/{provider}/cancel")
    public String cancel(
        @PathVariable("provider") String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam("mu") String merchantUid
    ) {
        log.info("[PAYMENT_CALLBACK][CANCEL] provider={}, pid={}, mu={}", provider, paymentId, merchantUid);
        paymentService.cancelFromCallback(paymentId, merchantUid);
        return "cancel callback received";
    }

    @GetMapping("/{provider}/fail")
    public String fail(
        @PathVariable("provider") String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam("mu") String merchantUid,
        @RequestParam(value = "resultCode", required = false) String resultCode,
        @RequestParam(value = "resultMessage", required = false) String resultMessage
    ) {
        paymentService.failFromCallback(paymentId, merchantUid, resultCode, resultMessage);
        return "fail callback received";
    }

    private String toCallbackParamsJson(
        String provider,
        Integer paymentId,
        String merchantUid,
        String pgToken,
        String naverPaymentId,
        String paymentKey,
        String orderId,
        BigDecimal amount
    ) {
        try {
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("provider", provider);
            params.put("paymentId", paymentId);
            params.put("merchantUid", merchantUid);
            params.put("pgToken", pgToken);
            params.put("naverPaymentId", naverPaymentId);
            params.put("paymentKey", paymentKey);
            params.put("orderId", orderId);
            params.put("amount", amount);
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            return null;
        }
    }
}
