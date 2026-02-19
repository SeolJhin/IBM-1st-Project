package org.myweb.uniplace.domain.property.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.myweb.uniplace.domain.property.domain.enums.BuildingStatus;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingUpdateRequest {

    @NotNull(message = "buildingId는 필수입니다.")
    private Long buildingId;

    @NotBlank(message = "buildingNm은 필수입니다.")
    private String buildingNm;

    @NotBlank(message = "buildingAddr은 필수입니다.")
    private String buildingAddr;

    private String buildingDesc;

    @NotNull(message = "totalFloor는 필수입니다.")
    private Integer totalFloor;

    private Integer parkingCapacity;
    private BigDecimal latitude;
    private BigDecimal longitude;

    @NotNull(message = "buildingStatus는 필수입니다.")
    private BuildingStatus buildingStatus; // Enum 타입
}
