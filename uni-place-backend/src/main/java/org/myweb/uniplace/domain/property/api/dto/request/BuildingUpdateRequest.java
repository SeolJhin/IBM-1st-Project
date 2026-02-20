package org.myweb.uniplace.domain.property.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class BuildingUpdateRequest {

    @Size(max = 50)
    private String buildingNm;

    @Size(max = 500)
    private String buildingAddr;

    @Size(max = 500)
    private String buildingDesc;

    @Size(max = 20)
    private String landCategory;

    @Digits(integer = 3, fraction = 2)
    private BigDecimal buildSize;

    @Size(max = 20)
    private String buildingUsage;

    @Pattern(regexp = "Y|N")
    private String existElv;

    @Min(0)
    private Integer parkingCapacity;
}
