// DTO (고정 시간대 + 예약가능 슬롯 응답)
// 경로: org/myweb/uniplace/domain/reservation/api/dto/response/SpaceReservableResponse.java
package org.myweb.uniplace.domain.reservation.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceReservableResponse {

    private Integer buildingId;
    private Integer spaceId;
    private String spaceNm;

    private List<TimeSlotResponse> availableSlots;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeSlotResponse {
        private String label;               // 예: "10:00~12:00"
        private LocalDateTime startAt;
        private LocalDateTime endAt;
    }
}