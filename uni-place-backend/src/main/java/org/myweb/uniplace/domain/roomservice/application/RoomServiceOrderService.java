package org.myweb.uniplace.domain.roomservice.application;

import org.myweb.uniplace.domain.roomservice.api.dto.request.RoomServiceOrderCreateReques;
import org.myweb.uniplace.domain.roomservice.api.dto.request.RoomServiceOrderStatusRequest;
import org.myweb.uniplace.domain.roomservice.api.dto.response.RoomServiceOrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RoomServiceOrderService {
    RoomServiceOrderResponse       createOrder(String userId, RoomServiceOrderCreateReques request);
    List<RoomServiceOrderResponse> getMyOrders(String userId);
    Page<RoomServiceOrderResponse> getAllOrders(Pageable pageable);
    RoomServiceOrderResponse       updateStatus(Long orderId, RoomServiceOrderStatusRequest request);
}
