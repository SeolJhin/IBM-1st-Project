// 경로: org/myweb/uniplace/domain/property/api/dto/request/BuildingUpdateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
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

    // ✅ 삭제할 파일 ID들 (Room/Space 동일)
    private List<Integer> deleteFileIds;

    // ✅ 새로 업로드할 파일들
    private List<MultipartFile> files;
}