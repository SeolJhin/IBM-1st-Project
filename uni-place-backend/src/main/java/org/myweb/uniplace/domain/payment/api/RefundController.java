package org.myweb.uniplace.domain.payment.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.myweb.uniplace.domain.payment.application.RefundService;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentRefundRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentRefundResponse;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping("/refund")
    public PaymentRefundResponse refund(@RequestBody PaymentRefundRequest request) {
        return refundService.refund(request);
    }
}