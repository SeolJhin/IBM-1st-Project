package org.myweb.uniplace.domain.payment.api;

import java.math.BigDecimal;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.application.PaymentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/callback")
@RequiredArgsConstructor
public class PaymentCallbackController {

    private final PaymentService paymentService;

    @GetMapping("/{provider}/approval")
    public PaymentResponse approval(
        @PathVariable String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam("mu") String merchantUid,
        @RequestParam(value = "pg_token", required = false) String pgToken,
        @RequestParam(value = "paymentId", required = false) String naverPaymentId,
        @RequestParam(value = "paymentKey", required = false) String paymentKey,
        @RequestParam(value = "orderId", required = false) String orderId,
        @RequestParam(value = "amount", required = false) BigDecimal amount
    ) {
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

        return paymentService.approveFromCallback(req);
    }

    @GetMapping("/{provider}/cancel")
    public String cancel(
        @PathVariable String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam("mu") String merchantUid
    ) {
        paymentService.cancelFromCallback(paymentId, merchantUid);
        return "cancel callback received";
    }

    @GetMapping("/{provider}/fail")
    public String fail(
        @PathVariable String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam("mu") String merchantUid,
        @RequestParam(value = "resultCode", required = false) String resultCode,
        @RequestParam(value = "resultMessage", required = false) String resultMessage
    ) {
        paymentService.failFromCallback(paymentId, merchantUid, resultCode, resultMessage);
        return "fail callback received";
    }
}
