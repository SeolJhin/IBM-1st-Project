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
    private Integer buildingId;          // 정확히
    private String buildingNm;           // 부분검색
    private String buildingAddr;         // 부분검색
    private Integer minParkingCapacity;  // 이상

    // ===== rooms =====
    private Integer roomNo;              // 정확히
    private Integer floor;               // 정확히

    private BigDecimal minRoomSize;      // 이상
    private BigDecimal maxRoomSize;      // 이하

    private BigDecimal minDeposit;       // 이상
    private BigDecimal maxDeposit;       // 이하

    private BigDecimal minRentPrice;     // 이상
    private BigDecimal maxRentPrice;     // 이하

    private BigDecimal minManageFee;     // 이상
    private BigDecimal maxManageFee;     // 이하

    private RentType rentType;           // equals
    private RoomStatus roomSt;           // equals
    private SunDirection sunDirection;   // equals

    private Integer minRoomCapacity;     // 이상
    private Integer maxRoomCapacity;     // 이하

    private Integer minRentMin;          // 이상
    private Integer maxRentMin;          // 이하

    private String roomOptions;          // 부분검색
}