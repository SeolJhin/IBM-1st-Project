package org.myweb.uniplace.domain.roomservice.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.roomservice.api.dto.request.RoomServiceOrderCreateReques;
import org.myweb.uniplace.domain.roomservice.api.dto.response.RoomServiceOrderResponse;
import org.myweb.uniplace.domain.roomservice.application.RoomServiceOrderService;
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
            @RequestBody RoomServiceOrderCreateReques request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                roomServiceOrderService.createOrder(authUser.getUserId(), request)
        ));
    }

    // GET /room-services/me
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<RoomServiceOrderResponse>>> getMyOrders(
            @AuthenticationPrincipal AuthUser authUser
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                roomServiceOrderService.getMyOrders(authUser.getUserId())
        ));
    }
}
