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
public class OrderService {

    private final OrderRepository   orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository    userRepository;

    /* 주문 생성 */
    public OrderResponse createOrder(String userId, OrderCreateRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 빈 Order 먼저 저장 (OrderItem의 FK 필요)
        Order order = Order.builder()
                .user(user)
                .orderStatus(OrderStatus.ordered)
                .totalPrice(BigDecimal.ZERO)
                .build();
        order = orderRepository.save(order);

        // OrderItem 생성
        List<OrderItem> items = new ArrayList<>();
        for (OrderCreateRequest.OrderItemDto dto : request.getItems()) {
            Product product = productRepository.findById(dto.getProdId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            items.add(OrderItem.of(order, product, dto.getOrderQuantity()));
        }

        // 총액 계산 후 반영
        BigDecimal totalPrice = items.stream()
                .map(OrderItem::getOrderPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.getOrderItems().addAll(items);
        order.updateTotalPrice(totalPrice);

        return OrderResponse.from(orderRepository.save(order));
    }

    /* 내 주문 목록 */
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String userId) {
        return orderRepository.findAllByUserIdWithItems(userId).stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    /* 주문 상세 */
    @Transactional(readOnly = true)
    public OrderResponse getOrder(String userId, Long orderNo) {
        Order order = orderRepository.findByIdWithItems(orderNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }
        return OrderResponse.from(order);
    }

    /* 주문 취소 */
    public OrderResponse cancelOrder(String userId, Long orderNo) {
        Order order = orderRepository.findByIdWithItems(orderNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }
        order.cancel();
        return OrderResponse.from(order);
    }

    /* 관리자 전체 조회 */
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllWithItems(pageable)
                .map(OrderResponse::from);
    }
}
