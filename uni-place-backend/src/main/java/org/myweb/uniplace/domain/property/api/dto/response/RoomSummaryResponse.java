package org.myweb.uniplace.domain.property.api.dto.response;

import java.math.BigDecimal;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.domain.enums.PetAllowedYn;
import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.RoomType;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomSummaryResponse {

    private Integer roomId;

    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private String buildingDesc;
    private Integer parkingCapacity;

    private Integer roomNo;
    private Integer floor;
    private BigDecimal roomSize;

    private RoomType roomType;
    private PetAllowedYn petAllowedYn;

    private BigDecimal deposit;
    private BigDecimal rentPrice;
    private BigDecimal manageFee;

    private RentType rentType;
    private RoomStatus roomSt;

    private Integer roomCapacity;
    private Integer rentMin;
    private SunDirection sunDirection;

    private Integer thumbnailFileId;
    private String thumbnailUrl;

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
                .roomType(e.getRoomType())
                .petAllowedYn(e.getPetAllowedYn())
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
                .roomType(base.getRoomType())
                .petAllowedYn(base.getPetAllowedYn())
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
