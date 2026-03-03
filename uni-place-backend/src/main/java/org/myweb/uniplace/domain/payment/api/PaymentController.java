package org.myweb.uniplace.domain.payment.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.myweb.uniplace.domain.payment.application.PaymentService;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareMonthlyBatchRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.RetryPaymentRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping({"/payments", "/api/payments"})
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/prepare")
    public PaymentPrepareResponse prepare(
        @AuthenticationPrincipal AuthUser authUser,
        @RequestBody PaymentPrepareRequest request
    ) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return paymentService.prepare(authUser.getUserId(), request);
    }

    @PostMapping("/prepare/monthly-batch")
    public PaymentPrepareResponse prepareMonthlyBatch(
        @AuthenticationPrincipal AuthUser authUser,
        @RequestBody PaymentPrepareMonthlyBatchRequest request
    ) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return paymentService.prepareMonthlyChargeBatch(authUser.getUserId(), request);
    }

    @PostMapping("/approve")
    public PaymentResponse approve(
        @AuthenticationPrincipal AuthUser authUser,
        @RequestBody PaymentApproveRequest request
    ) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return paymentService.approve(authUser.getUserId(), request);
    }

    @PostMapping("/retry")
    public PaymentResponse retry(
        @AuthenticationPrincipal AuthUser authUser,
        @RequestBody RetryPaymentRequest request
    ) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        if (request == null || request.getPaymentId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        return paymentService.retry(authUser.getUserId(), request.getPaymentId());
    }
}
