package org.myweb.uniplace.domain.property.application;

import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;

import java.util.List;

public interface BuildingService {

    BuildingDetailResponse getBuilding(Integer buildingId);

    List<BuildingDetailResponse> getAllBuildings();

    BuildingDetailResponse createBuilding(BuildingCreateRequest request);

    BuildingDetailResponse updateBuilding(Integer buildingId, BuildingCreateRequest request);
}
