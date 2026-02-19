// DTO (Request)
// 경로: org/myweb/uniplace/domain/property/api/dto_request/SpaceCreateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceCreateRequest {

    private String spaceNm;
    private Long buildingId;
    private Integer spaceCapacity;
    private Integer spaceFloor;
    private String spaceOptions;
    private String spaceDesc;
}