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

    // building
    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private String buildingDesc;
    private Integer parkingCapacity;

    // space
    private String spaceNm;
    private Integer spaceFloor;
    private Integer spaceCapacity;
    private String spaceOptions;

    // ✅ 목록 썸네일
    private Integer thumbnailFileId;
    private String thumbnailUrl;
    
    //썸네일없는거
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
                .spaceOptions(e.getSpaceOptions())
                .build();
    }
    //썸네일 있는거
    public static SpaceResponse fromEntity(CommonSpace e, Integer thumbnailFileId, String thumbnailUrl) {
        SpaceResponse base = fromEntity(e);
        return SpaceResponse.builder()
                .spaceId(base.getSpaceId())

                .buildingId(base.getBuildingId())
                .buildingNm(base.getBuildingNm())
                .buildingAddr(base.getBuildingAddr())
                .buildingDesc(base.getBuildingDesc())
                .parkingCapacity(base.getParkingCapacity())

                .spaceNm(base.getSpaceNm())
                .spaceFloor(base.getSpaceFloor())
                .spaceCapacity(base.getSpaceCapacity())
                .spaceOptions(base.getSpaceOptions())

                .thumbnailFileId(thumbnailFileId)
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}