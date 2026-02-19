//// 경로: org/myweb/uniplace/domain/property/api/dto/response/RoomSummaryResponse.java
//package org.myweb.uniplace.domain.property.api.dto.response;
//
//import java.math.BigDecimal;
//
//import org.myweb.uniplace.domain.property.domain.entity.Building;
//import org.myweb.uniplace.domain.property.domain.entity.Room;
//import org.myweb.uniplace.domain.property.domain.enums.RentType;
//import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
//import org.myweb.uniplace.domain.property.domain.enums.SunDirection;
//
//import lombok.*;
//
//@Getter
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//public class RoomSummaryResponse {
//
//    private Integer roomId;
//
//    // ✅ building 정보(요구사항)
//    private Integer buildingId;
//    private String buildingNm;
//    private String buildingAddr;
//    private String buildingDesc;
//    private Integer parkingCapacity;
//
//    private Integer roomNo;
//    private Integer floor;
//    private BigDecimal roomSize;
//
//    private BigDecimal deposit;
//    private BigDecimal rentPrice;
//    private BigDecimal manageFee;
//
//    private RentType rentType;
//    private RoomStatus roomSt;
//
//    private Integer roomCapacity;
//    private Integer rentMin;
//    private SunDirection sunDirection;
//
//    public static RoomSummaryResponse fromEntity(Room e) {
//
//        Building b = e.getBuilding();
//
//        return RoomSummaryResponse.builder()
//                .roomId(e.getRoomId())
//
//                .buildingId(b != null ? b.getBuildingId() : null)
//                .buildingNm(b != null ? b.getBuildingNm() : null)
//                .buildingAddr(b != null ? b.getBuildingAddr() : null)
//                .buildingDesc(b != null ? b.getBuildingDesc() : null)
//                .parkingCapacity(b != null ? b.getParkingCapacity() : null)
//
//                .roomNo(e.getRoomNo())
//                .floor(e.getFloor())
//                .roomSize(e.getRoomSize())
//                .deposit(e.getDeposit())
//                .rentPrice(e.getRentPrice())
//                .manageFee(e.getManageFee())
//                .rentType(e.getRentType())
//                .roomSt(e.getRoomSt())
//                .roomCapacity(e.getRoomCapacity())
//                .rentMin(e.getRentMin())
//                .sunDirection(e.getSunDirection())
//                .build();
//    }
//}