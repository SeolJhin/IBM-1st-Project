package org.myweb.uniplace.domain.commerce.application;

import org.myweb.uniplace.domain.commerce.api.dto.request.RoomServiceOrderCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.RoomServiceOrderStatusRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.RoomServiceOrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RoomServiceOrderService {
    RoomServiceOrderResponse       createOrder(String userId, RoomServiceOrderCreateRequest request);
    List<RoomServiceOrderResponse> getMyOrders(String userId);
    Page<RoomServiceOrderResponse> getAllOrders(Pageable pageable);
    RoomServiceOrderResponse       updateStatus(Integer orderId, RoomServiceOrderStatusRequest request);
    RoomServiceOrderResponse       cancelOrder(String userId, Integer orderId);  // 주문 취소
    void                           notifyOrderPaid(Integer orderId);             // 결제 완료 후 알림
}