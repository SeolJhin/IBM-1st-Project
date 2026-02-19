// 경로: org/myweb/uniplace/domain/property/api/dto/request/BuildingSearchRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingSearchRequest {

    // ===== building =====
    private Integer buildingId;          // 정확히
    private String buildingNm;           // 부분검색
    private String buildingAddr;         // 부분검색
    private Integer minParkingCapacity;  // 이상
    private String buildingStatus;       // equals (Enum이면 나중에 Enum으로 변경)
}
