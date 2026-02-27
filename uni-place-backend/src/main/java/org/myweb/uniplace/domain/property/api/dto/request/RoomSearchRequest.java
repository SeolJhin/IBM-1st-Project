package org.myweb.uniplace.domain.property.api.dto.request;

import java.math.BigDecimal;

import org.myweb.uniplace.domain.property.domain.enums.PetAllowedYn;
import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.RoomType;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomSearchRequest {

    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private Integer minParkingCapacity;

    private Integer roomNo;
    private Integer floor;

    private BigDecimal minRoomSize;
    private BigDecimal maxRoomSize;

    private RoomType roomType;
    private PetAllowedYn petAllowedYn;

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
