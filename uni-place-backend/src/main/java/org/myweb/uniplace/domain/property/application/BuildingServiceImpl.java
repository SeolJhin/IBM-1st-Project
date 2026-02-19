// 경로: org/myweb/uniplace/domain/property/application/BuildingServiceImpl.java
package org.myweb.uniplace.domain.property.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingSummaryResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BuildingServiceImpl implements BuildingService {

    private final BuildingRepository buildingRepository;

    @Override
    public Page<BuildingSummaryResponse> search(String keyword, Pageable pageable) {
        return buildingRepository.search(keyword, pageable)
                .map(BuildingSummaryResponse::fromEntity);
    }

    @Override
    public BuildingDetailResponse getDetail(Integer buildingId) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 건물입니다."));

        return BuildingDetailResponse.fromEntity(building);
    }

    @Override
    @Transactional
    public Integer create(BuildingCreateRequest request) {

        if (buildingRepository.existsByBuildingNm(request.getBuildingNm())) {
            throw new IllegalArgumentException("이미 존재하는 건물명입니다.");
        }

        Building building = Building.builder()
                .buildingNm(request.getBuildingNm())
                .buildingAddr(request.getBuildingAddr())
                .buildingDesc(request.getBuildingDesc())
                .landCategory(request.getLandCategory())
                .buildSize(request.getBuildSize())
                .buildingUsage(request.getBuildingUsage())
                .existElv(request.getExistElv())
                .parkingCapacity(request.getParkingCapacity())
                .build();

        return buildingRepository.save(building).getBuildingId();
    }

    @Override
    @Transactional
    public void update(Integer buildingId, BuildingUpdateRequest request) {

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 건물입니다."));

        building.update(
                request.getBuildingNm(),
                request.getBuildingAddr(),
                request.getBuildingDesc(),
                request.getLandCategory(),
                request.getBuildSize(),
                request.getBuildingUsage(),
                request.getExistElv(),
                request.getParkingCapacity()
        );
    }

    @Override
    @Transactional
    public void delete(Integer buildingId) {

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 건물입니다."));

        buildingRepository.delete(building);
    }
}
