// 경로: org/myweb/uniplace/domain/reservation/api/dto/response/TourReservationResponse.java
package org.myweb.uniplace.domain.reservation.api.dto.response;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.reservation.domain.entity.TourReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourReservationResponse {

    private Integer tourId;

    private Integer buildingId;
    private Integer roomId;

    private LocalDateTime tourStartAt;
    private LocalDateTime tourEndAt;

    private String tourNm;
    private String tourTel;

    private TourStatus tourSt;

    private LocalDateTime createdAt;

    public static TourReservationResponse fromEntity(TourReservationEntity e) {
        return TourReservationResponse.builder()
                .tourId(e.getTourId())
                .buildingId(e.getBuilding() != null ? e.getBuilding().getBuildingId() : null)
                .roomId(e.getRoom() != null ? e.getRoom().getRoomId() : null)
                .tourStartAt(e.getTourStartAt())
                .tourEndAt(e.getTourEndAt())
                .tourNm(e.getTourNm())
                .tourTel(e.getTourTel())
                .tourSt(e.getTourSt())
                .createdAt(e.getCreatedAt())
                .build();
    }
}