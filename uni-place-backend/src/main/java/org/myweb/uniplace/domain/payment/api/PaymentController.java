package org.myweb.uniplace.domain.payment.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.myweb.uniplace.domain.payment.application.PaymentService;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.RetryPaymentRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/prepare")
    public PaymentPrepareResponse prepare(@RequestBody PaymentPrepareRequest request) {
        return paymentService.prepare(request);
    }

    @PostMapping("/approve")
    public PaymentResponse approve(@RequestBody PaymentApproveRequest request) {
        return paymentService.approve(request);
    }

    @PostMapping("/retry")
    public PaymentResponse retry(@RequestBody RetryPaymentRequest request) {
        return paymentService.retry(request.getPaymentId());
    }
}