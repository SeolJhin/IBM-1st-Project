package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.OrderItem;

import java.math.BigDecimal;

@Getter
@Builder
public class OrderItemResponse {

    private Integer    orderItemId;
    private Integer    prodId;
    private String     prodNm;
    private Integer    buildingId;    // ← 추가
    private Integer    orderQuantity;
    private BigDecimal orderPrice;

    public static OrderItemResponse from(OrderItem item) {
        return OrderItemResponse.builder()
                .orderItemId(item.getOrderItemId())
                .prodId(item.getProduct().getProdId())
                .prodNm(item.getProduct().getProdNm())
                .buildingId(item.getBuildingId())
                .orderQuantity(item.getOrderQuantity())
                .orderPrice(item.getOrderPrice())
                .build();
    }
}