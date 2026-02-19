package org.myweb.uniplace.domain.property.application;

import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface BuildingService {

    BuildingResponse createBuilding(BuildingCreateRequest request);

    BuildingResponse updateBuilding(BuildingUpdateRequest request);

    void deactivateBuilding(Long buildingId);
    
    BuildingResponse getBuilding(Long buildingId);

    PageResponse<BuildingResponse> search(BuildingSearchRequest request, Pageable pageable);
}
