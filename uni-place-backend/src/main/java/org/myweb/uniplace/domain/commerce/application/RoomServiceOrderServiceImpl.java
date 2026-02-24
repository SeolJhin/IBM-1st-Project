package org.myweb.uniplace.domain.commerce.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.RoomServiceOrderCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.RoomServiceOrderStatusRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.RoomServiceOrderResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.entity.RoomServiceOrder;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.commerce.repository.RoomServiceOrderRepository;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomServiceOrderServiceImpl implements RoomServiceOrderService {

    private final RoomServiceOrderRepository roomServiceOrderRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    @Override
    public RoomServiceOrderResponse createOrder(String userId, RoomServiceOrderCreateRequest request) {
        if (request == null
            || request.getRoomId() == null
            || request.getTotalPrice() == null
            || request.getTotalPrice().signum() <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Room room = roomRepository.findById(request.getRoomId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        // ✅ 삭제된 방으로 룸서비스 주문 불가
        if (room.isDeleted()) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        Order parentOrder = resolveParentOrder(user, request);

        RoomServiceOrder roomServiceOrder = RoomServiceOrder.builder()
            .parentOrder(parentOrder)
            .user(user)
            .room(room)
            .totalPrice(request.getTotalPrice())
            .roomServiceDesc(request.getRoomServiceDesc())
            .build();

        roomServiceOrderRepository.save(roomServiceOrder);

        BigDecimal currentTotal = parentOrder.getTotalPrice() == null ? BigDecimal.ZERO : parentOrder.getTotalPrice();
        BigDecimal addAmount = request.getTotalPrice() == null ? BigDecimal.ZERO : request.getTotalPrice();
        parentOrder.updateTotalPrice(currentTotal.add(addAmount));

        return RoomServiceOrderResponse.from(roomServiceOrder);
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
    public RoomServiceOrderResponse updateStatus(Integer orderId, RoomServiceOrderStatusRequest request) {
        if (request == null || request.getOrderSt() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        RoomServiceOrder order = roomServiceOrderRepository.findById(orderId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_SERVICE_ORDER_NOT_FOUND));

        order.updateStatus(request.getOrderSt());
        return RoomServiceOrderResponse.from(order);
    }

    private Order resolveParentOrder(User user, RoomServiceOrderCreateRequest request) {
        if (request.getOrderId() != null) {
            Order existing = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

            if (!existing.getUser().getUserId().equals(user.getUserId())) {
                throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
            }
            if (existing.getOrderSt() != OrderStatus.ordered) {
                throw new BusinessException(ErrorCode.ORDER_CANNOT_CANCEL);
            }
            return existing;
        }

        Order created = Order.builder()
            .user(user)
            .orderSt(OrderStatus.ordered)
            .totalPrice(BigDecimal.ZERO)
            .build();
        return orderRepository.save(created);
    }
}
