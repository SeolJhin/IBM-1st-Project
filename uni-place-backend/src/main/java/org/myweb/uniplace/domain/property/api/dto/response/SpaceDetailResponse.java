// 경로: org/myweb/uniplace/domain/property/api/dto/response/SpaceDetailResponse.java
package org.myweb.uniplace.domain.property.api.dto.response;

import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.CommonSpace;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceDetailResponse {

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
    private String spaceDesc;

    // 상세 이미지들 (프론트에서 img src={viewUrl})
    private List<FileResponse> files;

    public static SpaceDetailResponse fromEntity(CommonSpace e, List<FileResponse> files) {

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

                .files(files)
                .build();
    }
}