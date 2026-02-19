// DTO
// 경로: org/myweb/uniplace/domain/property/api/dto/request/RoomCreateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import java.math.BigDecimal;
import java.util.List;

import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomCreateRequest {

    @NotBlank(message = "buildingNm은 필수입니다.")
    private String buildingNm;

    @NotNull(message = "roomNo는 필수입니다.")
    private Integer roomNo;

    @NotNull(message = "floor는 필수입니다.")
    private Integer floor;

    @NotNull(message = "roomSize는 필수입니다.")
    private BigDecimal roomSize;

    private BigDecimal deposit;

    @NotNull(message = "rentPrice는 필수입니다.")
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
}