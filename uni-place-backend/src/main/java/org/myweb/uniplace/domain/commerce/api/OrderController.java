package org.myweb.uniplace.domain.commerce.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.OrderCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.OrderResponse;
import org.myweb.uniplace.domain.commerce.application.OrderService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // POST /orders
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody OrderCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.createOrder(requireUserId(authUser), request)
        ));
    }

    // GET /orders/me
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getMyOrders(requireUserId(authUser))
        ));
    }

    // GET /orders/{orderId}
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("orderId") Integer orderId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getOrder(requireUserId(authUser), orderId)
        ));
    }

    // PATCH /orders/{orderId}/cancel
    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("orderId") Integer orderId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.cancelOrder(requireUserId(authUser), orderId)
        ));
    }

    private String requireUserId(AuthUser authUser) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return authUser.getUserId();
    }
}
