package org.myweb.uniplace.domain.property.api.dto.response;

import lombok.*;
import org.myweb.uniplace.domain.property.domain.entity.Building;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingDetailResponse {

    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private String buildingDesc;
    private Integer parkingCapacity;

    public static BuildingDetailResponse fromEntity(Building b) {
        return BuildingDetailResponse.builder()
                .buildingId(b.getBuildingId())
                .buildingNm(b.getBuildingNm())
                .buildingAddr(b.getBuildingAddr())
                .buildingDesc(b.getBuildingDesc())
                .parkingCapacity(b.getParkingCapacity())
                .build();
    }
}
