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
import org.springframework.data.domain.PageImpl;
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

    /* 주문 생성 */
    @Override
    public OrderResponse createOrder(String userId, OrderCreateRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
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
            if (dto == null || dto.getProdId() == null || dto.getOrderQuantity() == null || dto.getOrderQuantity() <= 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST);
            }
            Product product = productRepository.findByIdWithLock(dto.getProdId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            product.decreaseStock(dto.getOrderQuantity());
            items.add(OrderItem.of(order, product, dto.getOrderQuantity()));
        }

        BigDecimal totalPrice = items.stream()
                .map(OrderItem::getOrderPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.getOrderItems().addAll(items);
        order.updateTotalPrice(totalPrice);

        return OrderResponse.from(orderRepository.save(order));
    }

    /* 내 주문 목록 */
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String userId) {
        // ✅ 1단계: orderItems fetch
        List<Order> orders = orderRepository.findAllByUserIdWithItems(userId);
        // ✅ 2단계: roomServiceOrders fetch (같은 트랜잭션 → 1차 캐시에서 자동 병합)
        orderRepository.findAllByUserIdWithRoomServices(userId);

        return orders.stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    /* 주문 상세 */
    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(String userId, Integer orderId) {
        // ✅ 1단계: orderItems fetch
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        // ✅ 2단계: roomServiceOrders fetch
        orderRepository.findByIdWithRoomServices(orderId);

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }
        return OrderResponse.from(order);
    }

    /* 주문 취소 */
    @Override
    public OrderResponse cancelOrder(String userId, Integer orderId) {
        // ✅ 1단계: orderItems fetch
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        // ✅ 2단계: roomServiceOrders fetch
        orderRepository.findByIdWithRoomServices(orderId);

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        for (OrderItem item : order.getOrderItems()) {
            Product product = productRepository.findByIdWithLock(item.getProduct().getProdId())
                    .orElse(null);
            if (product != null) {
                product.restoreStock(item.getOrderQuantity());
            }
        }

        order.cancel();
        return OrderResponse.from(order);
    }

    /* 관리자 전체 조회 */
    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        // ✅ 1단계: 페이징 포함 orderItems fetch
        Page<Order> orderPage = orderRepository.findAllWithItems(pageable);

        // ✅ 2단계: roomServiceOrders fetch (ID 목록으로 in절 조회)
        List<Integer> orderIds = orderPage.getContent().stream()
                .map(Order::getOrderId)
                .collect(Collectors.toList());
        if (!orderIds.isEmpty()) {
            orderRepository.findAllWithRoomServicesByIds(orderIds);
        }

        return orderPage.map(OrderResponse::from);
    }
}
