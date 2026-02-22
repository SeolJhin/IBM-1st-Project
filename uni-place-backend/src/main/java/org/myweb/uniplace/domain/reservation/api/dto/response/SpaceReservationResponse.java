// DTO
// 경로: org/myweb/uniplace/domain/reservation/api/dto/response/SpaceReservationResponse.java
package org.myweb.uniplace.domain.reservation.api.dto.response;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.reservation.domain.entity.SpaceReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceReservationResponse {

    private Integer reservationId;

    private Integer buildingId;
    private Integer spaceId;
    private String userId;

    private LocalDateTime srStartAt;
    private LocalDateTime srEndAt;

    private Integer srNoPeople;

    private SpaceReservationStatus srSt;

    public static SpaceReservationResponse fromEntity(SpaceReservationEntity e) {
        return SpaceReservationResponse.builder()
                .reservationId(e.getReservationId())
                .buildingId(e.getBuilding() != null ? e.getBuilding().getBuildingId() : null)
                .spaceId(e.getSpace() != null ? e.getSpace().getSpaceId() : null)
                .userId(e.getUser() != null ? e.getUser().getUserId() : null)
                .srStartAt(e.getSrStartAt())
                .srEndAt(e.getSrEndAt())
                .srNoPeople(e.getSrNoPeople())
                .srSt(e.getSrSt())
                .build();
    }
}