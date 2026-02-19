// ServiceImpl
// 경로: org/myweb/uniplace/domain/property/application/SpaceServiceImpl.java
package org.myweb.uniplace.domain.property.application;

import org.myweb.uniplace.domain.property.api.dto.request.SpaceCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.SpaceSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.request.SpaceUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.CommonSpace;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.myweb.uniplace.domain.property.repository.SpaceRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SpaceServiceImpl implements SpaceService {

    private final SpaceRepository spaceRepository;
    private final BuildingRepository buildingRepository;

    @Override
    @Transactional(readOnly = true)
    public SpaceDetailResponse getSpace(Integer spaceId) {

        CommonSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("공용공간을 찾을 수 없습니다. spaceId=" + spaceId));

        return SpaceDetailResponse.fromEntity(space);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SpaceResponse> searchPage(SpaceSearchRequest request, Pageable pageable) {

        return spaceRepository.searchWithFilters(
                        request.getBuildingId(),
                        request.getBuildingNm(),
                        request.getBuildingAddr(),
                        request.getMinParkingCapacity(),
                        request.getSpaceNm(),
                        request.getSpaceFloor(),
                        request.getMinSpaceCapacity(),
                        request.getMaxSpaceCapacity(),
                        request.getSpaceOptions(),
                        pageable
                )
                .map(SpaceResponse::fromEntity);
    }

    @Override
    public SpaceDetailResponse createSpace(SpaceCreateRequest request) {

        if (request == null) {
            throw new IllegalArgumentException("요청 값이 비어있습니다.");
        }

        Building building = buildingRepository.findByBuildingNm(request.getBuildingNm())
                .orElseThrow(() -> new IllegalArgumentException("건물을 찾을 수 없습니다. buildingNm=" + request.getBuildingNm()));

        CommonSpace space = CommonSpace.builder()
                .building(building)
                .spaceNm(request.getSpaceNm())
                .spaceFloor(request.getSpaceFloor())
                .spaceCapacity(request.getSpaceCapacity())
                .spaceOptions(request.getSpaceOptions())
                .spaceDesc(request.getSpaceDesc())
                .build();

        CommonSpace saved = spaceRepository.save(space);

        return SpaceDetailResponse.fromEntity(saved);
    }

    @Override
    public SpaceDetailResponse updateSpace(Integer spaceId, SpaceUpdateRequest request) {

        CommonSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("공용공간을 찾을 수 없습니다. spaceId=" + spaceId));

        if (request == null) {
            return SpaceDetailResponse.fromEntity(space);
        }

        if (request.getBuildingNm() != null && !request.getBuildingNm().isBlank()) {
            Building building = buildingRepository.findByBuildingNm(request.getBuildingNm())
                    .orElseThrow(() -> new IllegalArgumentException("건물을 찾을 수 없습니다. buildingNm=" + request.getBuildingNm()));
            space.setBuilding(building);
        }

        if (request.getSpaceNm() != null) space.setSpaceNm(request.getSpaceNm());
        if (request.getSpaceFloor() != null) space.setSpaceFloor(request.getSpaceFloor());
        if (request.getSpaceCapacity() != null) space.setSpaceCapacity(request.getSpaceCapacity());
        if (request.getSpaceOptions() != null) space.setSpaceOptions(request.getSpaceOptions());
        if (request.getSpaceDesc() != null) space.setSpaceDesc(request.getSpaceDesc());

        CommonSpace saved = spaceRepository.save(space);

        return SpaceDetailResponse.fromEntity(saved);
    }

    @Override
    public void deleteSpace(Integer spaceId) {

        CommonSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("공용공간을 찾을 수 없습니다. spaceId=" + spaceId));

        spaceRepository.delete(space);
    }
}