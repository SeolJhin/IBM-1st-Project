// DTO
// 경로: org/myweb/uniplace/domain/property/api/dto/request/RoomSearchRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import java.math.BigDecimal;

import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomSearchRequest {

    // ===== building =====
    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private Integer minParkingCapacity;

    // ===== rooms =====
    private Integer roomNo;
    private Integer floor;

    private BigDecimal minRoomSize;
    private BigDecimal maxRoomSize;

    private BigDecimal minDeposit;
    private BigDecimal maxDeposit;

    private BigDecimal minRentPrice;
    private BigDecimal maxRentPrice;

    private BigDecimal minManageFee;
    private BigDecimal maxManageFee;

    private RentType rentType;
    private RoomStatus roomSt;
    private SunDirection sunDirection;

    private Integer minRoomCapacity;
    private Integer maxRoomCapacity;

    private Integer minRentMin;
    private Integer maxRentMin;

    private String roomOptions;
}