// 경로: org/myweb/uniplace/domain/property/api/dto/response/RoomSummaryResponse.java
package org.myweb.uniplace.domain.property.api.dto.response;

import java.math.BigDecimal;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomSummaryResponse {

    private Integer roomId;

    // ✅ building 정보(요구사항)
    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private String buildingDesc;
    private Integer parkingCapacity;

    private Integer roomNo;
    private Integer floor;
    private BigDecimal roomSize;

    private BigDecimal deposit;
    private BigDecimal rentPrice;
    private BigDecimal manageFee;

    private RentType rentType;
    private RoomStatus roomSt;

    private Integer roomCapacity;
    private Integer rentMin;
    private SunDirection sunDirection;

    // 추가: 목록에서 바로 미리보기용(첫 번째 이미지)
    private Integer thumbnailFileId; // 없으면 null
    private String thumbnailUrl;     // 없으면 null (예: /files/{id}/view)

    // 기존 fromEntity는 유지(썸네일 없는 버전)
    public static RoomSummaryResponse fromEntity(Room e) {

        Building b = e.getBuilding();

        return RoomSummaryResponse.builder()
                .roomId(e.getRoomId())

                .buildingId(b != null ? b.getBuildingId() : null)
                .buildingNm(b != null ? b.getBuildingNm() : null)
                .buildingAddr(b != null ? b.getBuildingAddr() : null)
                .buildingDesc(b != null ? b.getBuildingDesc() : null)
                .parkingCapacity(b != null ? b.getParkingCapacity() : null)

                .roomNo(e.getRoomNo())
                .floor(e.getFloor())
                .roomSize(e.getRoomSize())
                .deposit(e.getDeposit())
                .rentPrice(e.getRentPrice())
                .manageFee(e.getManageFee())
                .rentType(e.getRentType())
                .roomSt(e.getRoomSt())
                .roomCapacity(e.getRoomCapacity())
                .rentMin(e.getRentMin())
                .sunDirection(e.getSunDirection())
                .build();
    }

    // ✅ 썸네일까지 채우는 버전
    public static RoomSummaryResponse fromEntity(Room e, Integer thumbnailFileId, String thumbnailUrl) {
        RoomSummaryResponse base = fromEntity(e);

        return RoomSummaryResponse.builder()
                .roomId(base.getRoomId())
                .buildingId(base.getBuildingId())
                .buildingNm(base.getBuildingNm())
                .buildingAddr(base.getBuildingAddr())
                .buildingDesc(base.getBuildingDesc())
                .parkingCapacity(base.getParkingCapacity())
                .roomNo(base.getRoomNo())
                .floor(base.getFloor())
                .roomSize(base.getRoomSize())
                .deposit(base.getDeposit())
                .rentPrice(base.getRentPrice())
                .manageFee(base.getManageFee())
                .rentType(base.getRentType())
                .roomSt(base.getRoomSt())
                .roomCapacity(base.getRoomCapacity())
                .rentMin(base.getRentMin())
                .sunDirection(base.getSunDirection())

                .thumbnailFileId(thumbnailFileId)
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}