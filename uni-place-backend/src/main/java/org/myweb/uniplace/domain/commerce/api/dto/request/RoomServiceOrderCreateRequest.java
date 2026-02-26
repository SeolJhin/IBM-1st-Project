package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RoomServiceOrderCreateRequest {

    private Integer roomId;
    private Integer orderId;   // 기존 Order에 연결할 경우
    private String roomServiceDesc;
}