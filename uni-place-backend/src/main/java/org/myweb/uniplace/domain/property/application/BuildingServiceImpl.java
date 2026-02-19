package org.myweb.uniplace.domain.property.application;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BuildingServiceImpl implements BuildingService {

    private final BuildingRepository buildingRepository;

    @Override
    public BuildingDetailResponse getBuilding(Integer buildingId) {
        Building b = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 빌딩입니다."));
        return BuildingDetailResponse.fromEntity(b);
    }

    @Override
    public List<BuildingDetailResponse> getAllBuildings() {
        return buildingRepository.findAll()
                .stream()
                .map(BuildingDetailResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public BuildingDetailResponse createBuilding(BuildingCreateRequest request) {
        Building b = Building.builder()
                .buildingNm(request.getBuildingNm())
                .buildingAddr(request.getBuildingAddr())
                .buildingDesc(request.getBuildingDesc())
                .parkingCapacity(request.getParkingCapacity())
                .build();
        buildingRepository.save(b);
        return BuildingDetailResponse.fromEntity(b);
    }

    @Override
    public BuildingDetailResponse updateBuilding(Integer buildingId, BuildingCreateRequest request) {
        Building b = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 빌딩입니다."));
        b.setBuildingNm(request.getBuildingNm());
        b.setBuildingAddr(request.getBuildingAddr());
        b.setBuildingDesc(request.getBuildingDesc());
        b.setParkingCapacity(request.getParkingCapacity());
        return BuildingDetailResponse.fromEntity(b);
    }
}
