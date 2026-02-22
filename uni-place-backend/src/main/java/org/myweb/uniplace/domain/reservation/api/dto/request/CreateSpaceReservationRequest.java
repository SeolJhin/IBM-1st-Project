// DTO
// 경로: org/myweb/uniplace/domain/reservation/api/dto/request/CreateSpaceReservationRequest.java
package org.myweb.uniplace.domain.reservation.api.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSpaceReservationRequest {

    @NotNull(message = "buildingId는 필수입니다.")
    private Integer buildingId;

    @NotNull(message = "spaceId는 필수입니다.")
    private Integer spaceId;

    @NotNull(message = "srStartAt은 필수입니다.")
    private LocalDateTime srStartAt;

    @NotNull(message = "srEndAt은 필수입니다.")
    private LocalDateTime srEndAt;

    @NotNull(message = "srNoPeople는 필수입니다.")
    private Integer srNoPeople;
}