package org.myweb.uniplace.domain.commerce.application;

import org.myweb.uniplace.domain.commerce.api.dto.request.OrderCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {

    /* 주문 생성 */
    OrderResponse createOrder(String userId, OrderCreateRequest request);

    /* 내 주문 목록 */
    List<OrderResponse> getMyOrders(String userId);

    /* 주문 상세 */
    OrderResponse getOrder(String userId, Integer orderId);

    /* 주문 취소 */
    OrderResponse cancelOrder(String userId, Integer orderId);

    /* 관리자 전체 조회 */
    Page<OrderResponse> getAllOrders(Pageable pageable);
}