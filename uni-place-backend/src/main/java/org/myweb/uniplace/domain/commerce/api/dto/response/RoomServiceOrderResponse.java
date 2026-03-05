package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.RoomServiceOrder;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class RoomServiceOrderResponse {

    private Integer      orderId;
    private Integer   parentOrderId;
    private String    userId;
    private Integer   roomId;
    private Integer   roomNo;
    private String    buildingNm;
    private BigDecimal totalPrice;
    private RoomServiceOrderStatus orderSt;
    private OrderStatus parentOrderSt;
    private String paymentProvider;
    private String paymentSt;
    private String    roomServiceDesc;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RoomServiceOrderResponse from(RoomServiceOrder order) {
        return from(order, null);
    }

    public static RoomServiceOrderResponse from(RoomServiceOrder order, Payment payment) {
        return RoomServiceOrderResponse.builder()
                .orderId(order.getOrderId())
                .parentOrderId(order.getParentOrder().getOrderId())
                .userId(order.getUser().getUserId())
                .roomId(order.getRoom().getRoomId())
                .roomNo(order.getRoom().getRoomNo())
                .buildingNm(order.getRoom().getBuilding() != null ? order.getRoom().getBuilding().getBuildingNm() : null)
                .totalPrice(order.getTotalPrice())
                .orderSt(order.getOrderSt())
                .parentOrderSt(order.getParentOrder().getOrderSt())
                .paymentProvider(payment != null ? payment.getProvider() : null)
                .paymentSt(payment != null ? payment.getPaymentSt() : null)
                .roomServiceDesc(order.getRoomServiceDesc())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
