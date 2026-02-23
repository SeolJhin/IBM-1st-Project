package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RoomServiceOrderCreateRequest {
    private Integer    orderId;         // ✅ 추가: 부모 Order ID (선택값, null 가능)
    private Integer    roomId;
    private BigDecimal totalPrice;
    private String     roomServiceDesc;
}
