package org.myweb.uniplace.domain.commerce.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.commerce.api.dto.request.OrderCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.OrderResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.entity.OrderItem;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.entity.RoomServiceOrder;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.commerce.repository.ProductRepository;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final ContractRepository contractRepository;
    private final NotificationService notificationService;
    private final SlackNotificationService slackNotificationService;

    @Override
    public OrderResponse createOrder(String userId, OrderCreateRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Contract tenantContract = resolveTenantContract(
            userId,
            request.getBuildingId(),
            request.getRoomId()
        );

        Integer buildingId = tenantContract.getRoom() == null || tenantContract.getRoom().getBuilding() == null
            ? null
            : tenantContract.getRoom().getBuilding().getBuildingId();
        if (buildingId == null) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        Order order = Order.builder()
            .user(user)
            .orderSt(OrderStatus.ordered)
            .totalPrice(BigDecimal.ZERO)
            .build();
        order = orderRepository.save(order);

        List<OrderItem> items = new ArrayList<>();
        for (OrderCreateRequest.OrderItemDto dto : request.getItems()) {
            if (dto == null || dto.getProdId() == null
                || dto.getOrderQuantity() == null || dto.getOrderQuantity() <= 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST);
            }

            Product product = productRepository.findByIdWithLock(dto.getProdId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

            productService.decreaseBuildingStock(
                dto.getProdId(),
                buildingId,
                dto.getOrderQuantity()
            );

            items.add(OrderItem.of(order, product, buildingId, dto.getOrderQuantity()));
        }

        BigDecimal totalPrice = items.stream()
            .map(OrderItem::getOrderPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.getOrderItems().addAll(items);
        order.updateTotalPrice(totalPrice);

        RoomServiceOrder roomServiceOrder = RoomServiceOrder.builder()
            .parentOrder(order)
            .user(user)
            .room(tenantContract.getRoom())
            .totalPrice(totalPrice)
            .roomServiceDesc(trimToNull(request.getRoomServiceDesc()))
            .build();
        order.getRoomServiceOrders().add(roomServiceOrder);

        OrderResponse saved = OrderResponse.from(orderRepository.save(order));
        Integer roomServiceOrderId = roomServiceOrder.getOrderId();
        String adminUrlPath = roomServiceOrderId == null
            ? "/admin/roomservice/room_orders"
            : "/admin/roomservice/room_orders?orderId=" + roomServiceOrderId;

        try {
            notificationService.notifyAdmins(
                NotificationType.ORDER_NEW.name(),
                "Room service order created. userId=" + userId
                    + ", roomId=" + tenantContract.getRoom().getRoomId()
                    + ", orderId=" + roomServiceOrderId,
                userId,
                TargetType.notice,
                roomServiceOrderId,
                adminUrlPath
            );
        } catch (Exception e) {
            log.warn("[ORDER][NOTIFY][ADMIN] reason={}", e.getMessage());
        }

        // 주문 생성 → Slack 알림
        try {
            slackNotificationService.sendRoomServiceOrderAlert(
                userId,
                tenantContract.getRoom() != null ? tenantContract.getRoom().getRoomNo() : null,
                tenantContract.getRoom() != null ? tenantContract.getRoom().getRoomId() : null,
                trimToNull(request.getRoomServiceDesc()),
                saved.getOrderId()
            );
        } catch (Exception e) {
            log.warn("[ORDER][SLACK] reason={}", e.getMessage());
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String userId) {
        List<Order> orders = orderRepository.findAllByUserIdWithItems(userId);
        orderRepository.findAllByUserIdWithRoomServices(userId);
        return orders.stream()
            .map(OrderResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(String userId, Integer orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        orderRepository.findByIdWithRoomServices(orderId);

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }
        return OrderResponse.from(order);
    }

    @Override
    public OrderResponse cancelOrder(String userId, Integer orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        orderRepository.findByIdWithRoomServices(orderId);

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        for (OrderItem item : order.getOrderItems()) {
            if (item.getBuildingId() != null) {
                productService.restoreBuildingStock(
                    item.getProduct().getProdId(),
                    item.getBuildingId(),
                    item.getOrderQuantity()
                );
            }
        }

        order.getRoomServiceOrders().forEach(rso -> {
            if (rso.getOrderSt() != RoomServiceOrderStatus.cancelled) {
                rso.updateStatus(RoomServiceOrderStatus.cancelled);
            }
        });

        order.cancel();
        return OrderResponse.from(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        Page<Order> orderPage = orderRepository.findAllWithItems(pageable);
        List<Integer> orderIds = orderPage.getContent().stream()
            .map(Order::getOrderId)
            .collect(Collectors.toList());
        if (!orderIds.isEmpty()) {
            orderRepository.findAllWithRoomServicesByIds(orderIds);
        }
        return orderPage.map(OrderResponse::from);
    }

    private Contract resolveTenantContract(
        String userId,
        Integer requestedBuildingId,
        Integer requestedRoomId
    ) {
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
            .filter(c -> c.getRoom().getBuilding() != null && c.getRoom().getBuilding().getBuildingId() != null)
            .filter(c -> requestedBuildingId == null
                || Objects.equals(c.getRoom().getBuilding().getBuildingId(), requestedBuildingId))
            .filter(c -> requestedRoomId == null
                || Objects.equals(c.getRoom().getRoomId(), requestedRoomId))
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
