package org.myweb.uniplace.domain.contract.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResidentCreateRequest {

    @NotNull(message = "buildingId는 필수입니다.")
    private Integer buildingId;

    @NotNull(message = "contractId는 필수입니다.")
    private Integer contractId;

    @NotNull(message = "userId는 필수입니다.")
    private String userId;
}