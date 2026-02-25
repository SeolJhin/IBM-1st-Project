package org.myweb.uniplace.domain.commerce.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.RoomServiceOrderCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.RoomServiceOrderResponse;
import org.myweb.uniplace.domain.commerce.application.RoomServiceOrderService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/room-services")
@RequiredArgsConstructor
public class RoomServiceOrderController {

    private final RoomServiceOrderService roomServiceOrderService;

    // POST /room-services
    @PostMapping
    public ResponseEntity<ApiResponse<RoomServiceOrderResponse>> createOrder(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody RoomServiceOrderCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                roomServiceOrderService.createOrder(requireUserId(authUser), request)
        ));
    }

    // GET /room-services/me
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<RoomServiceOrderResponse>>> getMyOrders(
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                roomServiceOrderService.getMyOrders(requireUserId(authUser))
        ));
    }

    // PATCH /room-services/{orderId}/cancel
    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<RoomServiceOrderResponse>> cancelOrder(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("orderId") Integer orderId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                roomServiceOrderService.cancelOrder(requireUserId(authUser), orderId)
        ));
    }

    private String requireUserId(AuthUser authUser) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return authUser.getUserId();
    }
}
