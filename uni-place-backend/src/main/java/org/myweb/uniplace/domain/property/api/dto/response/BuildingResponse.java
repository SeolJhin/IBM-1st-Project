package org.myweb.uniplace.domain.property.api.dto.response;

import lombok.*;
import org.myweb.uniplace.domain.property.domain.enums.BuildingStatus;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingResponse {

    private Long buildingId;
    private String buildingNm;
    private String buildingAddr;
    private String buildingDesc;
    private Integer totalFloor;
    private Integer parkingCapacity;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BuildingStatus buildingStatus;
    private Integer isActive;
}
