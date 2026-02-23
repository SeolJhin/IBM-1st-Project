package org.myweb.uniplace.domain.payment.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.myweb.uniplace.domain.payment.application.RefundService;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentRefundRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentRefundResponse;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping("/refund")
    public PaymentRefundResponse refund(
        @AuthenticationPrincipal AuthUser authUser,
        @RequestBody PaymentRefundRequest request
    ) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return refundService.refund(authUser.getUserId(), request);
    }
}
