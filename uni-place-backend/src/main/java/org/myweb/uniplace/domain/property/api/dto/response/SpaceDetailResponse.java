// DTO
// 경로: org/myweb/uniplace/domain/property/api/dto/response/SpaceDetailResponse.java
package org.myweb.uniplace.domain.property.api.dto.response;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.CommonSpace;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceDetailResponse {

    private Integer spaceId;

    // building 정보(요구사항 패턴 동일)
    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private String buildingDesc;
    private Integer parkingCapacity;

    private String spaceNm;
    private Integer spaceFloor;
    private Integer spaceCapacity;

    private String spaceOptions;
    private String spaceDesc;

    public static SpaceDetailResponse fromEntity(CommonSpace e) {

        Building b = e.getBuilding();

        return SpaceDetailResponse.builder()
                .spaceId(e.getSpaceId())

                .buildingId(b != null ? b.getBuildingId() : null)
                .buildingNm(b != null ? b.getBuildingNm() : null)
                .buildingAddr(b != null ? b.getBuildingAddr() : null)
                .buildingDesc(b != null ? b.getBuildingDesc() : null)
                .parkingCapacity(b != null ? b.getParkingCapacity() : null)

                .spaceNm(e.getSpaceNm())
                .spaceFloor(e.getSpaceFloor())
                .spaceCapacity(e.getSpaceCapacity())
                .spaceOptions(e.getSpaceOptions())
                .spaceDesc(e.getSpaceDesc())
                .build();
    }
}