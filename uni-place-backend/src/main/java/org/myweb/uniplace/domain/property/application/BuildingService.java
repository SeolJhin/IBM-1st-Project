// 경로: org/myweb/uniplace/domain/property/application/BuildingService.java
package org.myweb.uniplace.domain.property.application;

import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BuildingService {

    Page<BuildingSummaryResponse> search(String keyword, Pageable pageable);

    BuildingDetailResponse getDetail(Integer buildingId);

    Integer create(BuildingCreateRequest request);

    void update(Integer buildingId, BuildingUpdateRequest request);

    void delete(Integer buildingId);
}
