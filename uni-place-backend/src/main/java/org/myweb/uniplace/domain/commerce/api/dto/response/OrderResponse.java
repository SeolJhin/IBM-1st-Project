package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class OrderResponse {

    private Integer orderId;
    private String userId;
    private OrderStatus orderSt;
    private BigDecimal totalPrice;
    private LocalDateTime orderCreatedAt;
    private List<OrderItemResponse> orderItems;
    private List<RoomServiceOrderResponse> roomServiceOrders;

    public static OrderResponse from(Order order) {
        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .userId(order.getUser().getUserId())
                .orderSt(order.getOrderSt())
                .totalPrice(order.getTotalPrice())
                .orderCreatedAt(order.getOrderCreatedAt())
                .orderItems(order.getOrderItems().stream()
                        .map(OrderItemResponse::from)
                        .collect(Collectors.toList()))
                .roomServiceOrders(order.getRoomServiceOrders().stream()
                        .map(RoomServiceOrderResponse::from)
                        .collect(Collectors.toList()))
                .build();
    }
}