// 경로: org/myweb/uniplace/domain/property/application/BuildingService.java
package org.myweb.uniplace.domain.property.application;

import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingSummaryResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BuildingService {

    // 일반 사용자: 삭제된 건물 제외
    BuildingDetailResponse getBuilding(Integer buildingId);

    // 관리자: 삭제된 건물도 조회 가능
    BuildingDetailResponse getBuildingForAdmin(Integer buildingId);

    // 일반 사용자: 삭제된 건물 제외 목록
    Page<BuildingSummaryResponse> searchPage(Pageable pageable);

    BuildingDetailResponse createBuilding(BuildingCreateRequest request);
    BuildingDetailResponse updateBuilding(Integer buildingId, BuildingUpdateRequest request);

    // ✅ soft delete (deleteYn = 'Y' + 연결된 Room들도 함께 soft delete)
    void deleteBuilding(Integer buildingId);
}
