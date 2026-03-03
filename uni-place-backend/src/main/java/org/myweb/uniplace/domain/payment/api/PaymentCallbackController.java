package org.myweb.uniplace.domain.payment.api;

import java.math.BigDecimal;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.application.PaymentService;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/callback")
@RequiredArgsConstructor
public class PaymentCallbackController {

    private static final Logger log = LoggerFactory.getLogger(PaymentCallbackController.class);

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;
    private final PaymentRepository paymentRepository;
    private final MonthlyChargeRepository monthlyChargeRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @GetMapping("/{provider}/approval")
    public ResponseEntity<Void> approval(
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

        try {
            PaymentResponse response = paymentService.approveFromCallback(req);
            log.info("[PAYMENT_CALLBACK][APPROVAL_OK] provider={}, pid={}, st={}",
                provider,
                response != null ? response.getPaymentId() : null,
                response != null ? response.getPaymentSt() : null
            );
            return redirect(resolveRedirectUrl(paymentId, "success"));
        } catch (Exception e) {
            log.warn("[PAYMENT_CALLBACK][APPROVAL_FAIL] provider={}, pid={}, reason={}",
                provider, paymentId, e.getMessage());
            return redirect(resolveRedirectUrl(paymentId, "fail"));
        }
    }

    @GetMapping("/{provider}/cancel")
    public ResponseEntity<Void> cancel(
        @PathVariable("provider") String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam("mu") String merchantUid
    ) {
        log.info("[PAYMENT_CALLBACK][CANCEL] provider={}, pid={}, mu={}", provider, paymentId, merchantUid);
        paymentService.cancelFromCallback(paymentId, merchantUid);
        return redirect(resolveRedirectUrl(paymentId, "cancel"));
    }

    @GetMapping("/{provider}/fail")
    public ResponseEntity<Void> fail(
        @PathVariable("provider") String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam("mu") String merchantUid,
        @RequestParam(value = "resultCode", required = false) String resultCode,
        @RequestParam(value = "resultMessage", required = false) String resultMessage
    ) {
        paymentService.failFromCallback(paymentId, merchantUid, resultCode, resultMessage);
        return redirect(resolveRedirectUrl(paymentId, "fail"));
    }

    private ResponseEntity<Void> redirect(String url) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    private String resolveRedirectUrl(Integer paymentId, String result) {
        Payment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null) {
            return buildFrontendUrl("/?payment=" + result);
        }

        String targetType = payment.getTargetType() == null
            ? ""
            : payment.getTargetType().trim().toLowerCase();

        if ("order".equals(targetType)) {
            return buildFrontendUrl("/commerce/orders?payment=" + result);
        }

        if ("monthly_charge".equals(targetType)) {
            Integer contractId = monthlyChargeRepository.findById(payment.getTargetId())
                .map(MonthlyCharge::getContractId)
                .orElse(null);

            String contractQuery = contractId == null ? "" : "&contractId=" + contractId;
            return buildFrontendUrl("/me?tab=myroom&sub=rent-payment" + contractQuery + "&payment=" + result);
        }

        return buildFrontendUrl("/?payment=" + result);
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

    private String buildFrontendUrl(String pathWithQuery) {
        String base = (frontendUrl == null || frontendUrl.isBlank())
            ? "http://localhost:3000"
            : frontendUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (pathWithQuery == null || pathWithQuery.isBlank()) {
            return base + "/";
        }
        if (!pathWithQuery.startsWith("/")) {
            return base + "/" + pathWithQuery;
        }
        return base + pathWithQuery;
    }
}
