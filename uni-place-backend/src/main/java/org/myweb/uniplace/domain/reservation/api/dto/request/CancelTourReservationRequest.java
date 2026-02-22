// DTO
// 경로: org/myweb/uniplace/domain/reservation/api/dto/request/CancelTourReservationRequest.java
package org.myweb.uniplace.domain.reservation.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CancelTourReservationRequest {

    @NotBlank(message = "tourTel은 필수입니다.")
    private String tourTel;

    @NotBlank(message = "tourPwd는 필수입니다.")
    @Pattern(regexp = "^[0-9]{4}$", message = "tourPwd는 숫자 4자리여야 합니다.")
    private String tourPwd;
}