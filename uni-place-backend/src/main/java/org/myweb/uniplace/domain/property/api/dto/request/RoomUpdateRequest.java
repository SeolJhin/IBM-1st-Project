// 경로: org/myweb/uniplace/domain/property/api/dto/request/RoomUpdateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import java.math.BigDecimal;
import java.util.List;

import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;

import org.springframework.web.multipart.MultipartFile;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomUpdateRequest {

    // 건물 변경이 필요하면 이름으로 변경(선택) List<Building> findByBuildingNm(String buildingNm);
    private String buildingNm;

    private Integer roomNo;
    private Integer floor;
    private BigDecimal roomSize;

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

    private List<MultipartFile> files;
    private List<Integer> deleteFileIds;
}