package org.myweb.uniplace.domain.property.api.dto.response;

import java.math.BigDecimal;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
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
public class RoomDetailResponse {

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

    private String roomOptions;
    private Integer roomCapacity;
    private Integer rentMin;
    private SunDirection sunDirection;

    private String roomDesc;

    private List<FileResponse> files;

    public static RoomDetailResponse fromEntity(Room e, List<FileResponse> files) {

        Building b = e.getBuilding();

        return RoomDetailResponse.builder()
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
                .roomOptions(e.getRoomOptions())
                .roomCapacity(e.getRoomCapacity())
                .rentMin(e.getRentMin())
                .sunDirection(e.getSunDirection())
                .roomDesc(e.getRoomDesc())
                .files(files)
                .build();
    }
}
