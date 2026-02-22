package org.myweb.uniplace.domain.commerce.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.RoomServiceOrderStatusRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.RoomServiceOrderResponse;
import org.myweb.uniplace.domain.commerce.application.RoomServiceOrderService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/room-services")
@RequiredArgsConstructor
public class AdminRoomServiceOrderController {

    private final RoomServiceOrderService roomServiceOrderService;

    // GET /admin/room-services
    @GetMapping
    public ResponseEntity<ApiResponse<Page<RoomServiceOrderResponse>>> getAllOrders(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                roomServiceOrderService.getAllOrders(pageable)
        ));
    }

    // PATCH /admin/room-services/{id}/status
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RoomServiceOrderResponse>> updateStatus(
            @PathVariable("id") Integer orderId,
            @RequestBody RoomServiceOrderStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                roomServiceOrderService.updateStatus(orderId, request)
        ));
    }
}
