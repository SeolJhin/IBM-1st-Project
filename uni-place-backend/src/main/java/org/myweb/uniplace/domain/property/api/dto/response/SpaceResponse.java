// DTO
// 경로: org/myweb/uniplace/domain/property/api/dto/response/SpaceResponse.java
package org.myweb.uniplace.domain.property.api.dto.response;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.CommonSpace;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceResponse {

    private Integer spaceId;

    // building 정보
    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private String buildingDesc;
    private Integer parkingCapacity;

    private String spaceNm;
    private Integer spaceFloor;
    private Integer spaceCapacity;

    public static SpaceResponse fromEntity(CommonSpace e) {

        Building b = e.getBuilding();

        return SpaceResponse.builder()
                .spaceId(e.getSpaceId())

                .buildingId(b != null ? b.getBuildingId() : null)
                .buildingNm(b != null ? b.getBuildingNm() : null)
                .buildingAddr(b != null ? b.getBuildingAddr() : null)
                .buildingDesc(b != null ? b.getBuildingDesc() : null)
                .parkingCapacity(b != null ? b.getParkingCapacity() : null)

                .spaceNm(e.getSpaceNm())
                .spaceFloor(e.getSpaceFloor())
                .spaceCapacity(e.getSpaceCapacity())
                .build();
    }
}