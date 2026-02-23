package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.RoomServiceOrder;
import org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class RoomServiceOrderResponse {

    private Integer      orderId;
    private String    userId;
    private Integer   roomId;
    private Integer   roomNo;
    private BigDecimal totalPrice;
    private RoomServiceOrderStatus orderSt;
    private String    roomServiceDesc;
    private LocalDateTime createdAt;

    public static RoomServiceOrderResponse from(RoomServiceOrder order) {
        return RoomServiceOrderResponse.builder()
                .orderId(order.getOrderId())
                .userId(order.getUser().getUserId())
                .roomId(order.getRoom().getRoomId())
                .roomNo(order.getRoom().getRoomNo())
                .totalPrice(order.getTotalPrice())
                .orderSt(order.getOrderSt())
                .roomServiceDesc(order.getRoomServiceDesc())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
