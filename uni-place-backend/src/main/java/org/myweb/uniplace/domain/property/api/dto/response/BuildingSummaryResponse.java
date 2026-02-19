// dto/response/BuildingSummaryResponse.java
package org.myweb.uniplace.domain.property.api.dto.response;

import lombok.*;
import org.myweb.uniplace.domain.property.domain.entity.Building;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingSummaryResponse {

    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private Integer parkingCapacity;

    public static BuildingSummaryResponse fromEntity(Building b) {
        return BuildingSummaryResponse.builder()
                .buildingId(b.getBuildingId())
                .buildingNm(b.getBuildingNm())
                .buildingAddr(b.getBuildingAddr())
                .parkingCapacity(b.getParkingCapacity())
                .build();
    }
}
