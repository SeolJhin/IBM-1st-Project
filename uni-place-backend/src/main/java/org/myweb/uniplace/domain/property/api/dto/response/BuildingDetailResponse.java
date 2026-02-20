// dto/response/BuildingDetailResponse.java
package org.myweb.uniplace.domain.property.api.dto.response;

import lombok.*;
import org.myweb.uniplace.domain.property.domain.entity.Building;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingDetailResponse {

    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private String buildingDesc;

    private String landCategory;
    private BigDecimal buildSize;
    private String buildingUsage;
    private String existElv;
    private Integer parkingCapacity;

    public static BuildingDetailResponse fromEntity(Building b) {
        return BuildingDetailResponse.builder()
                .buildingId(b.getBuildingId())
                .buildingNm(b.getBuildingNm())
                .buildingAddr(b.getBuildingAddr())
                .buildingDesc(b.getBuildingDesc())
                .landCategory(b.getLandCategory())
                .buildSize(b.getBuildSize())
                .buildingUsage(b.getBuildingUsage())
                .existElv(b.getExistElv())
                .parkingCapacity(b.getParkingCapacity())
                .build();
    }
}
