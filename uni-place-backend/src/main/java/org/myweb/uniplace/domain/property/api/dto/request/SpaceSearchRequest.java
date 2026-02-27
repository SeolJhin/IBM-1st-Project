// DTO
// 경로: org/myweb/uniplace/domain/property/api/dto/request/SpaceSearchRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceSearchRequest {

    // ===== building =====
    private Integer buildingId;          // 정확히
    private String buildingNm;           // 부분검색
    private String buildingAddr;         // 부분검색
    private Integer minParkingCapacity;  // 이상 (Building 조건)

    // ===== space =====
    private String spaceNm;              // 부분검색
    private Integer spaceFloor;          // 정확히
    private Integer minSpaceCapacity;    // 이상
    private Integer maxSpaceCapacity;    // 이하
    private String spaceOptions;         // 부분검색
}