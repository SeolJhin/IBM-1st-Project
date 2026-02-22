package org.myweb.uniplace.domain.payment.api;

import java.math.BigDecimal;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.application.PaymentService;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/callback")
@RequiredArgsConstructor
public class PaymentCallbackController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final PaymentIntentRepository paymentIntentRepository;

    @GetMapping("/{provider}/approval")
    public PaymentResponse approval(
        @PathVariable String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam(value = "pg_token", required = false) String pgToken,
        @RequestParam(value = "paymentId", required = false) String naverPaymentId,
        @RequestParam(value = "paymentKey", required = false) String paymentKey,
        @RequestParam(value = "orderId", required = false) String orderId,
        @RequestParam(value = "amount", required = false) BigDecimal amount
    ) {
        PaymentApproveRequest req = new PaymentApproveRequest();
        req.setPaymentId(paymentId);

        if ("naver".equalsIgnoreCase(provider)) {
            req.setPgToken(naverPaymentId);
        } else {
            req.setPgToken(pgToken);
        }

        if ("toss".equalsIgnoreCase(provider)) {
            req.setPaymentKey(paymentKey);
        }

        return paymentService.approve(req);
    }

    @GetMapping("/{provider}/cancel")
    public void cancel(
        @PathVariable String provider,
        @RequestParam("pid") Integer paymentId
    ) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        PaymentIntent intent = paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(paymentId)
            .orElse(null);

        if (intent != null) {
            intent.markCanceled();
            paymentIntentRepository.save(intent);
        }

        payment.markCanceled();
        paymentRepository.save(payment);
    }

    @GetMapping("/{provider}/fail")
    public void fail(
        @PathVariable String provider,
        @RequestParam("pid") Integer paymentId,
        @RequestParam(value = "resultCode", required = false) String resultCode,
        @RequestParam(value = "resultMessage", required = false) String resultMessage
    ) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        PaymentIntent intent = paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(paymentId)
            .orElse(null);

        if (intent != null) {
            intent.markApproveFail(resultCode, resultMessage, null);
            paymentIntentRepository.save(intent);
        }

        payment.markCanceled();
        paymentRepository.save(payment);
    }
}
