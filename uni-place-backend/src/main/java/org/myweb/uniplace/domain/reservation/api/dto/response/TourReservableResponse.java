// DTO (추가) 방 예약 가능 슬롯 조회 응답
// 경로: org/myweb/uniplace/domain/reservation/api/dto/response/TourReservableResponse.java
package org.myweb.uniplace.domain.reservation.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourReservableResponse {

    private Integer buildingId;
    private Integer roomId;

    private List<TimeSlotResponse> availableSlots;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeSlotResponse {
        private String label; // 예: "10:00~10:30"
        private LocalDateTime startAt;
        private LocalDateTime endAt;
    }
}