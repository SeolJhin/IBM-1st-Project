// 경로: org/myweb/uniplace/domain/property/api/dto/response/BuildingDetailResponse.java
package org.myweb.uniplace.domain.property.api.dto.response;

import java.math.BigDecimal;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;

import lombok.*;

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

    // ✅ 임대인 정보
    private String buildingLessorNm;
    private String buildingLessorTel;
    private String buildingLessorAddr;
    private String buildingLessorRrn;

    private List<FileResponse> files;

    public static BuildingDetailResponse fromEntity(Building b, List<FileResponse> files) {
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
                .buildingLessorNm(b.getBuildingLessorNm())
                .buildingLessorTel(b.getBuildingLessorTel())
                .buildingLessorAddr(b.getBuildingLessorAddr())
                .buildingLessorRrn(b.getBuildingLessorRrn())
                .files(files)
                .build();
    }
}
