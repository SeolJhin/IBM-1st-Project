package org.myweb.uniplace.domain.roomservice.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
import org.myweb.uniplace.domain.roomservice.api.dto.request.RoomServiceOrderCreateReques;
import org.myweb.uniplace.domain.roomservice.api.dto.request.RoomServiceOrderStatusRequest;
import org.myweb.uniplace.domain.roomservice.api.dto.response.RoomServiceOrderResponse;
import org.myweb.uniplace.domain.roomservice.domain.entity.RoomServiceOrder;
import org.myweb.uniplace.domain.roomservice.repository.RoomServiceOrderRepository;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomServiceOrderServiceImpl implements RoomServiceOrderService {

    private final RoomServiceOrderRepository roomServiceOrderRepository;
    private final UserRepository             userRepository;
    private final RoomRepository             roomRepository;

    @Override
    public RoomServiceOrderResponse createOrder(String userId, RoomServiceOrderCreateReques request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        RoomServiceOrder order = RoomServiceOrder.builder()
                .user(user)
                .room(room)
                .totalPrice(request.getTotalPrice())
                .roomServiceDesc(request.getRoomServiceDesc())
                .build();

        return RoomServiceOrderResponse.from(roomServiceOrderRepository.save(order));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomServiceOrderResponse> getMyOrders(String userId) {
        return roomServiceOrderRepository.findAllByUserIdWithRoom(userId).stream()
                .map(RoomServiceOrderResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomServiceOrderResponse> getAllOrders(Pageable pageable) {
        return roomServiceOrderRepository.findAllWithDetails(pageable)
                .map(RoomServiceOrderResponse::from);
    }

    @Override
    public RoomServiceOrderResponse updateStatus(Long orderId, RoomServiceOrderStatusRequest request) {
        RoomServiceOrder order = roomServiceOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_SERVICE_ORDER_NOT_FOUND));

        order.updateStatus(request.getOrderSt());
        return RoomServiceOrderResponse.from(order);
    }
}
