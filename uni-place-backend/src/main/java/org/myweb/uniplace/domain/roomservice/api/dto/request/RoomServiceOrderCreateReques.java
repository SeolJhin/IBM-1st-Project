package org.myweb.uniplace.domain.roomservice.api.dto.request;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RoomServiceOrderCreateReques {
    private Integer    roomId;
    private BigDecimal totalPrice;
    private String     roomServiceDesc;
}
