package org.myweb.uniplace.domain.commerce.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.OrderCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.OrderResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.entity.OrderItem;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.commerce.repository.ProductRepository;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository   orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository    userRepository;
    private final ProductService    productService;  // 빌딩별 재고 차감/복원

    /* ── 주문 생성 ───────────────────────────────────────────────────────── */
    @Override
    public OrderResponse createOrder(String userId, OrderCreateRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (request.getBuildingId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

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

            // ✅ 빌딩별 재고 차감 (product.prod_stock은 건드리지 않음)
            productService.decreaseBuildingStock(
                dto.getProdId(),
                request.getBuildingId(),
                dto.getOrderQuantity()
            );

            // buildingId를 order_items에 저장해 취소 시 복원에 활용
            items.add(OrderItem.of(order, product, request.getBuildingId(), dto.getOrderQuantity()));
        }

        BigDecimal totalPrice = items.stream()
                .map(OrderItem::getOrderPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.getOrderItems().addAll(items);
        order.updateTotalPrice(totalPrice);

        return OrderResponse.from(orderRepository.save(order));
    }

    /* ── 내 주문 목록 ───────────────────────────────────────────────────── */
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String userId) {
        List<Order> orders = orderRepository.findAllByUserIdWithItems(userId);
        orderRepository.findAllByUserIdWithRoomServices(userId);
        return orders.stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    /* ── 주문 상세 ───────────────────────────────────────────────────────── */
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

    /* ── 주문 취소 ───────────────────────────────────────────────────────── */
    @Override
    public OrderResponse cancelOrder(String userId, Integer orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        orderRepository.findByIdWithRoomServices(orderId);

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        for (OrderItem item : order.getOrderItems()) {
            // ✅ order_items.building_id가 있으면 빌딩별 재고 복원
            if (item.getBuildingId() != null) {
                productService.restoreBuildingStock(
                    item.getProduct().getProdId(),
                    item.getBuildingId(),
                    item.getOrderQuantity()
                );
            }
        }

        order.cancel();
        return OrderResponse.from(order);
    }

    /* ── 관리자 전체 조회 ────────────────────────────────────────────────── */
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
}