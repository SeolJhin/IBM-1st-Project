// 경로: org/myweb/uniplace/domain/reservation/api/dto/request/CancelSpaceReservationRequest.java
package org.myweb.uniplace.domain.reservation.api.dto.request;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelSpaceReservationRequest {

    // 선택: 운영/로그용 (DB에 저장 안 해도 됨)
    private String cancelReason;
}