package org.myweb.uniplace.domain.commerce.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.response.OrderResponse;
import org.myweb.uniplace.domain.commerce.application.OrderService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    // GET /admin/orders
    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @PageableDefault(size = 20, sort = "orderCreatedAt") Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getAllOrders(pageable)
        ));
    }
}
