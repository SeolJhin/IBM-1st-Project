package org.myweb.uniplace.domain.roomservice.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.roomservice.domain.enums.RoomServiceOrderStatus;

@Getter
public class RoomServiceOrderStatusRequest {
    private RoomServiceOrderStatus orderSt;
}
