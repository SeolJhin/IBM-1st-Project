package org.myweb.uniplace.domain.property.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingCreateRequest {

    @NotBlank(message = "buildingNm은 필수입니다.")
    private String buildingNm;

    @NotBlank(message = "buildingAddr은 필수입니다.")
    private String buildingAddr;

    private String buildingDesc;

    private Integer parkingCapacity;
}
