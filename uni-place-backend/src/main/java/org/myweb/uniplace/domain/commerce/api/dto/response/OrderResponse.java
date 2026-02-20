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

    private Long        orderNo;
    private String      userId;
    private OrderStatus orderStatus;
    private BigDecimal  totalPrice;
    private Long        paymentId;
    private LocalDateTime orderCreatedAt;
    private List<OrderItemResponse> orderItems;

    public static OrderResponse from(Order order) {
        return OrderResponse.builder()
                .orderNo(order.getOrderNo())
                .userId(order.getUser().getUserId())
                .orderStatus(order.getOrderStatus())
                .totalPrice(order.getTotalPrice())
                .paymentId(order.getPaymentId())
                .orderCreatedAt(order.getOrderCreatedAt())
                .orderItems(order.getOrderItems().stream()
                        .map(OrderItemResponse::from)
                        .collect(Collectors.toList()))
                .build();
    }
}
