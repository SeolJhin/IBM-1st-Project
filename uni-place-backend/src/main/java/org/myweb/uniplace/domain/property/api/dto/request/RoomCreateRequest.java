package org.myweb.uniplace.domain.property.api.dto.request;

import java.math.BigDecimal;
import java.util.List;

import org.myweb.uniplace.domain.property.domain.enums.PetAllowedYn;
import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.RoomType;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomCreateRequest {

    @NotBlank(message = "buildingNm is required")
    private String buildingNm;

    @NotNull(message = "roomNo is required")
    private Integer roomNo;

    @NotNull(message = "floor is required")
    private Integer floor;

    @NotNull(message = "roomSize is required")
    private BigDecimal roomSize;

    private RoomType roomType;
    private PetAllowedYn petAllowedYn;

    private BigDecimal deposit;

    @NotNull(message = "rentPrice is required")
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
