package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class RoomSearchRequest {

    private String userId;
    private String checkInDate;
    private String checkOutDate;
    private String buildingAddr;
    private String roomType;
    private Integer rentPrice;
    private Integer roomCapacity;
    private String petAllowedYn;
    private String option;

    public AiIntent getIntent() {
        return AiIntent.ROOM_AVAILABILITY_SEARCH;
    }
}
