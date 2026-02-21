package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RoomServiceOrderCreateRequest {
    private Integer    roomId;
    private BigDecimal totalPrice;
    private String     roomServiceDesc;
}
