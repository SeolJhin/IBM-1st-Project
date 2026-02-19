// DTO
// 경로: org/myweb/uniplace/domain/property/api/dto/request/SpaceCreateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceCreateRequest {

    // building을 이름으로 받음
    @NotBlank(message = "buildingNm은 필수입니다.")
    private String buildingNm;

    @NotBlank(message = "spaceNm은 필수입니다.")
    private String spaceNm;

    @NotNull(message = "spaceFloor는 필수입니다.")
    private Integer spaceFloor;

    private Integer spaceCapacity;

    private String spaceOptions;
    private String spaceDesc;
}