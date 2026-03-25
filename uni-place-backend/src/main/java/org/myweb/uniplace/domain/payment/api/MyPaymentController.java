package org.myweb.uniplace.domain.payment.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.payment.api.dto.response.MyPaymentResponse;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/payments/my")
@RequiredArgsConstructor
public class MyPaymentController {

    private final PaymentRepository paymentRepository;
    private final OrderRepository   orderRepository;

    /**
     * 내 결제 내역 목록
     * GET /payments/my?targetType=monthly_charge&year=2026&month=3&page=1&size=10
     */
    @GetMapping
    public ApiResponse<PageResponse<MyPaymentResponse>> getMyPayments(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(name = "targetType", required = false) String targetType,
            @RequestParam(name = "year",       required = false) Integer year,
            @RequestParam(name = "month",      required = false) Integer month,
            @RequestParam(name = "page",       defaultValue = "1")  int page,
            @RequestParam(name = "size",       defaultValue = "10") int size
    ) {
        if (authUser == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        List<Payment> all = paymentRepository
                .findAllByUserIdOrderByPaymentIdDesc(authUser.getUserId());

        // targetType 필터
        if (targetType != null && !targetType.isBlank()) {
            final String ft = targetType;
            all = all.stream()
                    .filter(p -> ft.equals(p.getTargetType()))
                    .collect(Collectors.toList());
        }

        // 년/월 필터 (paidAt이 null이면 생성시점 기준으로 fallback)
        if (year != null && month != null) {
            final int y = year, m = month;
            all = all.stream()
                    .filter(p -> {
                        java.time.LocalDateTime dt = p.getPaidAt();
                        if (dt == null) {
                            // 미결제 건은 payment 생성 시점(paymentId 기반 조회 시점) 기준
                            // Payment에 createdAt이 없으므로 제외하지 않고 포함
                            return true;
                        }
                        return dt.getYear() == y && dt.getMonthValue() == m;
                    })
                    .collect(Collectors.toList());
        } else if (year != null) {
            final int y = year;
            all = all.stream()
                    .filter(p -> {
                        java.time.LocalDateTime dt = p.getPaidAt();
                        if (dt == null) return true;
                        return dt.getYear() == y;
                    })
                    .collect(Collectors.toList());
        }

        // 페이징
        int total   = all.size();
        int fromIdx = Math.min((page - 1) * size, total);
        int toIdx   = Math.min(fromIdx + size, total);
        List<MyPaymentResponse> paged = all.subList(fromIdx, toIdx)
                .stream()
                .map(p -> {
                    if ("order".equals(p.getTargetType()) && p.getTargetId() != null) {
                        Order order = orderRepository.findById(p.getTargetId()).orElse(null);
                        return MyPaymentResponse.from(p, order);
                    }
                    return MyPaymentResponse.from(p);
                })
                .collect(Collectors.toList());

        Pageable pageable = PageRequest.of(page - 1, size);
        Page<MyPaymentResponse> result = new PageImpl<>(paged, pageable, total);

        return ApiResponse.ok(PageResponse.of(result));
    }

    /**
     * 결제 상세 — targetType = "order" 이면 주문 상품 목록도 포함
     */
    @GetMapping("/{paymentId}")
    public ApiResponse<MyPaymentResponse> getMyPaymentDetail(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable(name = "paymentId") Integer paymentId
    ) {
        if (authUser == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!p.getUserId().equals(authUser.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 룸서비스(order)면 주문 상세 함께 조회
        if ("order".equals(p.getTargetType()) && p.getTargetId() != null) {
            Order order = orderRepository.findById(p.getTargetId()).orElse(null);
            return ApiResponse.ok(MyPaymentResponse.from(p, order));
        }

        return ApiResponse.ok(MyPaymentResponse.from(p));
    }
}
