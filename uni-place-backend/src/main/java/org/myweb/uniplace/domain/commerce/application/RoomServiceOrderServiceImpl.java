package org.myweb.uniplace.domain.commerce.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.commerce.api.dto.request.RoomServiceOrderCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.RoomServiceOrderStatusRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.RoomServiceOrderResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.entity.RoomServiceOrder;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.commerce.repository.RoomServiceOrderRepository;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.slack.SlackNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RoomServiceOrderServiceImpl implements RoomServiceOrderService {

    private final RoomServiceOrderRepository roomServiceOrderRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final NotificationService notificationService;
    private final SlackNotificationService slackNotificationService;

    @Override
    public RoomServiceOrderResponse createOrder(String userId, RoomServiceOrderCreateRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Contract tenantContract = resolveTenantContract(userId, request.getRoomId());
        Room tenantRoom = tenantContract.getRoom();
        if (tenantRoom == null || tenantRoom.getRoomId() == null) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        if (request.getRoomId() != null && !tenantRoom.getRoomId().equals(request.getRoomId())) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        Order parentOrder = resolveParentOrder(user, request);

        BigDecimal parentTotal = parentOrder.getTotalPrice() == null
            ? BigDecimal.ZERO
            : parentOrder.getTotalPrice();

        RoomServiceOrder roomServiceOrder = RoomServiceOrder.builder()
            .parentOrder(parentOrder)
            .user(user)
            .room(tenantRoom)
            .totalPrice(parentTotal)
            .roomServiceDesc(trimToNull(request.getRoomServiceDesc()))
            .build();

        roomServiceOrderRepository.save(roomServiceOrder);
        Integer roomServiceOrderId = roomServiceOrder.getOrderId();
        String adminUrlPath = roomServiceOrderId == null
            ? "/admin/roomservice/room_orders"
            : "/admin/roomservice/room_orders?orderId=" + roomServiceOrderId;

        // 주문 접수 → 어드민 알림
        try {
            notificationService.notifyAdmins(
                NotificationType.ORDER_NEW.name(),
                "룸서비스 주문이 접수되었습니다. userId=" + userId + ", roomId=" + tenantRoom.getRoomId(),
                userId, TargetType.notice, roomServiceOrderId, adminUrlPath
            );
        } catch (Exception e) {
            log.warn("[ORDER][NOTIFY][ADMIN] reason={}", e.getMessage());
        }

        // 주문 접수 → Slack 알림
        try {
            slackNotificationService.sendRoomServiceOrderAlert(
                userId,
                tenantRoom.getRoomNo(),
                tenantRoom.getRoomId(),
                trimToNull(request.getRoomServiceDesc()),
                roomServiceOrder.getOrderId()
            );
        } catch (Exception e) {
            log.warn("[ORDER][SLACK] reason={}", e.getMessage());
        }

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

        // 상태 변경 → 유저 알림
        try {
            notificationService.notifyUser(
                order.getUser().getUserId(),
                NotificationType.ORDER_STATUS.name(),
                "룸서비스 주문 상태가 변경되었습니다. 상태: " + request.getOrderSt().name(),
                null, TargetType.notice, null, "/mypage/orders"
            );
        } catch (Exception e) {
            log.warn("[ORDER][NOTIFY] status orderId={} reason={}", orderId, e.getMessage());
        }

        return RoomServiceOrderResponse.from(order);
    }

    @Override
    public RoomServiceOrderResponse cancelOrder(String userId, Integer orderId) {
        RoomServiceOrder roomServiceOrder = roomServiceOrderRepository.findById(orderId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_SERVICE_ORDER_NOT_FOUND));

        if (!roomServiceOrder.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        if (roomServiceOrder.getOrderSt() == RoomServiceOrderStatus.cancelled) {
            throw new BusinessException(ErrorCode.ORDER_CANNOT_CANCEL);
        }

        roomServiceOrder.updateStatus(RoomServiceOrderStatus.cancelled);

        Order parentOrder = roomServiceOrder.getParentOrder();
        boolean allCancelled = parentOrder.getRoomServiceOrders().stream()
            .allMatch(rso -> rso.getOrderSt() == RoomServiceOrderStatus.cancelled);

        if (allCancelled) {
            if (parentOrder.getOrderSt() == OrderStatus.ordered) {
                parentOrder.cancel();
            } else if (parentOrder.getOrderSt() == OrderStatus.paid) {
                parentOrder.markRefunded(null);
            }
        }

        return RoomServiceOrderResponse.from(roomServiceOrder);
    }

    private Order resolveParentOrder(User user, RoomServiceOrderCreateRequest request) {
        if (request.getOrderId() != null) {
            Order existing = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

            if (!existing.getUser().getUserId().equals(user.getUserId())) {
                throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
            }

            if (existing.getOrderSt() != OrderStatus.ordered) {
                throw new BusinessException(ErrorCode.ORDER_INVALID_STATUS);
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

    private Contract resolveTenantContract(String userId, Integer requestedRoomId) {
        List<Contract> contracts = contractRepository.findActiveContractsWithRoomAndBuilding(
            userId,
            ContractStatus.active,
            LocalDate.now()
        );

        if (contracts.isEmpty()) {
            throw new BusinessException(ErrorCode.ROOM_SERVICE_TENANT_ONLY);
        }

        List<Contract> candidates = contracts.stream()
            .filter(c -> c.getRoom() != null && c.getRoom().getRoomId() != null)
            .filter(c -> requestedRoomId == null || Objects.equals(c.getRoom().getRoomId(), requestedRoomId))
            .sorted(Comparator.comparing(Contract::getContractStart).reversed()
                .thenComparing(Contract::getContractId, Comparator.reverseOrder()))
            .collect(Collectors.toList());

        if (candidates.isEmpty()) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        return candidates.get(0);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
