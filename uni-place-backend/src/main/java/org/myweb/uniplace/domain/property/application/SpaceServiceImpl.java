// 경로: org/myweb/uniplace/domain/property/application/SpaceServiceImpl.java
package org.myweb.uniplace.domain.property.application;

import java.util.List;

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
                .orElseThrow(() -> new IllegalArgumentException(
                        "공용공간을 찾을 수 없습니다. spaceId=" + spaceId
                ));

        return SpaceDetailResponse.fromEntity(space);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SpaceResponse> searchPage(SpaceSearchRequest request, Pageable pageable) {

        // ✅ 너 프로젝트 SpaceRepository에 아래 메서드가 있어야 함.
        //    (RoomRepository.searchWithFilters(...)처럼)
        //    메서드명/파라미터가 다르면 여기만 너 코드에 맞게 수정해줘.
        Page<CommonSpace> page = spaceRepository.searchWithFilters(
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
        );

        return page.map(SpaceResponse::fromEntity);
    }

    @Override
    public SpaceDetailResponse createSpace(SpaceCreateRequest request) {

        Building building = resolveBuildingByName(request.getBuildingNm());

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
                .orElseThrow(() -> new IllegalArgumentException(
                        "공용공간을 찾을 수 없습니다. spaceId=" + spaceId
                ));

        if (request == null) {
            return SpaceDetailResponse.fromEntity(space);
        }

        // ✅ 핵심: buildingRepository.findByBuildingNm()이 List 반환이므로 Optional.orElseThrow() 금지
        if (request.getBuildingNm() != null && !request.getBuildingNm().isBlank()) {
            space.setBuilding(resolveBuildingByName(request.getBuildingNm()));
        }

        if (request.getSpaceNm() != null && !request.getSpaceNm().isBlank()) {
            space.setSpaceNm(request.getSpaceNm());
        }

        if (request.getSpaceFloor() != null) {
            space.setSpaceFloor(request.getSpaceFloor());
        }

        if (request.getSpaceCapacity() != null) {
            space.setSpaceCapacity(request.getSpaceCapacity());
        }

        if (request.getSpaceOptions() != null) {
            space.setSpaceOptions(request.getSpaceOptions());
        }

        if (request.getSpaceDesc() != null) {
            space.setSpaceDesc(request.getSpaceDesc());
        }

        CommonSpace saved = spaceRepository.save(space);
        return SpaceDetailResponse.fromEntity(saved);
    }

    @Override
    public void deleteSpace(Integer spaceId) {

        CommonSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "공용공간을 찾을 수 없습니다. spaceId=" + spaceId
                ));

        // ✅ 하드 삭제(실제 row 삭제)
        // 소프트 삭제 구조면 여기 대신 deleteYn='Y'로 업데이트하는 로직으로 바꿔야 함.
        spaceRepository.delete(space);
    }

    // ✅ RoomServiceImpl과 동일한 방식: buildingNm으로 찾되 List 기반으로 안전 처리
    private Building resolveBuildingByName(String buildingNm) {

        List<Building> buildings = buildingRepository.findByBuildingNm(buildingNm);

        if (buildings == null || buildings.isEmpty()) {
            throw new IllegalArgumentException(
                    "건물을 찾을 수 없습니다. buildingNm=" + buildingNm
            );
        }

        if (buildings.size() > 1) {
            throw new IllegalArgumentException(
                    "건물명이 중복됩니다. buildingNm=" + buildingNm + " (buildingId로 지정 필요)"
            );
        }

        return buildings.get(0);
    }
}