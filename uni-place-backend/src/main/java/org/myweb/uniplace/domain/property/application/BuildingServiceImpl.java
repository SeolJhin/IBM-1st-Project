package org.myweb.uniplace.domain.property.application;


import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.domain.property.application.BuildingService;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;



import java.util.Optional;

@Service
public class BuildingServiceImpl implements BuildingService {


    private final BuildingRepository buildingRepository;

    public BuildingServiceImpl(BuildingRepository buildingRepository) {
        this.buildingRepository = buildingRepository;
    }
    
    @Override
    public BuildingResponse getBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("해당 건물이 존재하지 않습니다: " + buildingId));
    }

    @Override
    public PageResponse<BuildingResponse> search(BuildingSearchRequest request, Pageable pageable) {
        Page<BuildingResponse> page = buildingRepository.searchWithFilters(
                request.getBuildingId(),
                request.getBuildingNm(),
                request.getBuildingAddr(),
                request.getMinParkingCapacity(),
                request.getBuildingStatus(),
                pageable
        ).map(this::toResponse);

        return new PageResponse<>(page);
    }

    

    @Override
    @Transactional
    public BuildingResponse createBuilding(BuildingCreateRequest request) {
        if (buildingRepository.findByBuildingNm(request.getBuildingNm()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 건물 이름입니다.");
        }

        Building building = Building.builder()
                .buildingNm(request.getBuildingNm())
                .buildingAddr(request.getBuildingAddr())
                .buildingDesc(request.getBuildingDesc())
                .totalFloor(request.getTotalFloor())
                .parkingCapacity(request.getParkingCapacity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .buildingStatus(request.getBuildingStatus())
                .build();

        Building saved = buildingRepository.save(building);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BuildingResponse updateBuilding(BuildingUpdateRequest request) {
        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new IllegalArgumentException("해당 건물이 존재하지 않습니다."));

        Optional<Building> existing = buildingRepository.findByBuildingNm(request.getBuildingNm());
        if (existing.isPresent() && !existing.get().getBuildingId().equals(request.getBuildingId())) {
            throw new IllegalArgumentException("이미 존재하는 건물 이름입니다.");
        }

        building.setBuildingNm(request.getBuildingNm());
        building.setBuildingAddr(request.getBuildingAddr());
        building.setBuildingDesc(request.getBuildingDesc());
        building.setTotalFloor(request.getTotalFloor());
        building.setParkingCapacity(request.getParkingCapacity());
        building.setLatitude(request.getLatitude());
        building.setLongitude(request.getLongitude());
        building.setBuildingStatus(request.getBuildingStatus());

        Building updated = buildingRepository.save(building);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deactivateBuilding(Long buildingId) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException("해당 건물이 존재하지 않습니다."));
        building.deactivate();
    }

    private BuildingResponse toResponse(Building b) {
        return BuildingResponse.builder()
                .buildingId(b.getBuildingId())
                .buildingNm(b.getBuildingNm())
                .buildingAddr(b.getBuildingAddr())
                .buildingDesc(b.getBuildingDesc())
                .totalFloor(b.getTotalFloor())
                .parkingCapacity(b.getParkingCapacity())
                .latitude(b.getLatitude())
                .longitude(b.getLongitude())
                .buildingStatus(b.getBuildingStatus())
                .isActive(b.getIsActive())
                .build();
    }
}
