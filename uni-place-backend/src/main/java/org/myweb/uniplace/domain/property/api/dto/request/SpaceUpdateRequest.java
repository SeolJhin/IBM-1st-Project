// DTO
// 경로: org/myweb/uniplace/domain/property/api/dto/request/SpaceUpdateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceUpdateRequest {

    // 건물 변경 필요하면 이름으로(선택)
    private String buildingNm;

    private String spaceNm;
    private Integer spaceFloor;
    private Integer spaceCapacity;

    private String spaceOptions;
    private String spaceDesc;
}