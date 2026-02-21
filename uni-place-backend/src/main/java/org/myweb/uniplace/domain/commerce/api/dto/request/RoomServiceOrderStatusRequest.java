package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus;

@Getter
public class RoomServiceOrderStatusRequest {
    private RoomServiceOrderStatus orderSt;
}
