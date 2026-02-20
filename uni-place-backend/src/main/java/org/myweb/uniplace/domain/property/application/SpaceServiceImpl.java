// 경로: org/myweb/uniplace/domain/property/application/SpaceServiceImpl.java
package org.myweb.uniplace.domain.property.application;

import java.util.List;
import java.util.Set;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.file.domain.enums.FileRefType;
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

    // ✅ 파일 서비스 추가
    private final FileService fileService;

    private static final Set<String> IMAGE_EXTS =
            Set.of(".png", ".jpg", ".jpeg", ".gif", ".webp");

    private boolean isImageExt(String ext) {
        if (ext == null) return false;
        return IMAGE_EXTS.contains(ext.toLowerCase());
    }

    @Override
    @Transactional(readOnly = true)
    public SpaceDetailResponse getSpace(Integer spaceId) {

        CommonSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "공용공간을 찾을 수 없습니다. spaceId=" + spaceId
                ));

        // ✅ 상세 이미지들
        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.SPACE.dbValue(), spaceId);

        return SpaceDetailResponse.fromEntity(space, files);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SpaceResponse> searchPage(SpaceSearchRequest request, Pageable pageable) {

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

        // ✅ Room과 동일: 첫 번째 이미지 파일을 썸네일로
        return page.map(space -> {
            List<FileResponse> files =
                    fileService.getActiveFiles(FileRefType.SPACE.dbValue(), space.getSpaceId());

            FileResponse firstImage = null;
            if (files != null) {
                for (FileResponse f : files) {
                    if (f != null && isImageExt(f.getFileType())) {
                        firstImage = f;
                        break;
                    }
                }
            }

            Integer thumbId = (firstImage != null ? firstImage.getFileId() : null);
            String thumbUrl = (firstImage != null ? firstImage.getViewUrl() : null);

            return SpaceResponse.fromEntity(space, thumbId, thumbUrl);
        });
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

        // ✅ 파일 업로드
        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
            fileService.uploadFiles(FileUploadRequest.builder()
                    .fileParentType(FileRefType.SPACE.dbValue())
                    .fileParentId(saved.getSpaceId())
                    .files(request.getFiles())
                    .build());
        }

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.SPACE.dbValue(), saved.getSpaceId());

        return SpaceDetailResponse.fromEntity(saved, files);
    }

    @Override
    public SpaceDetailResponse updateSpace(Integer spaceId, SpaceUpdateRequest request) {

        CommonSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "공용공간을 찾을 수 없습니다. spaceId=" + spaceId
                ));

        if (request == null) {
            List<FileResponse> files = fileService.getActiveFiles(FileRefType.SPACE.dbValue(), spaceId);
            return SpaceDetailResponse.fromEntity(space, files);
        }

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

        // ✅ 삭제 파일 처리(soft delete)
        if (request.getDeleteFileIds() != null && !request.getDeleteFileIds().isEmpty()) {
            fileService.softDeleteFilesByParent(
                    FileRefType.SPACE.dbValue(),
                    spaceId,
                    request.getDeleteFileIds()
            );
        }

        // ✅ 새 파일 업로드
        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
            fileService.uploadFiles(FileUploadRequest.builder()
                    .fileParentType(FileRefType.SPACE.dbValue())
                    .fileParentId(spaceId)
                    .files(request.getFiles())
                    .build());
        }

        // ✅ 저장은 트랜잭션 더티체킹으로도 되지만, 유지해도 OK
        CommonSpace saved = spaceRepository.save(space);

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.SPACE.dbValue(), spaceId);

        return SpaceDetailResponse.fromEntity(saved, files);
    }

    @Override
    public void deleteSpace(Integer spaceId) {

        CommonSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "공용공간을 찾을 수 없습니다. spaceId=" + spaceId
                ));

        spaceRepository.delete(space);
    }

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