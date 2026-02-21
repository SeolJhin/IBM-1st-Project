// 경로: org/myweb/uniplace/domain/reservation/api/dto/request/CreateTourReservationRequest.java
package org.myweb.uniplace.domain.reservation.api.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTourReservationRequest {

    @NotNull(message = "buildingId는 필수입니다.")
    private Integer buildingId;

    @NotNull(message = "roomId는 필수입니다.")
    private Integer roomId;

    @NotNull(message = "tourStartAt은 필수입니다.")
    private LocalDateTime tourStartAt;

    @NotNull(message = "tourEndAt은 필수입니다.")
    private LocalDateTime tourEndAt;

    @NotBlank(message = "tourNm은 필수입니다.")
    private String tourNm;

    @NotBlank(message = "tourTel은 필수입니다.")
    private String tourTel;

    @NotBlank(message = "tourPwd는 필수입니다.")
    @Pattern(regexp = "^[0-9]{4}$", message = "tourPwd는 숫자 4자리여야 합니다.")
    private String tourPwd;
}