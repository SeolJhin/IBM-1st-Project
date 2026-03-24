package org.myweb.uniplace.domain.property.application;

import java.util.List;
import java.util.Map;
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
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

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
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));

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

        List<Integer> spaceIds = page.getContent().stream()
                .map(CommonSpace::getSpaceId).toList();
        Map<Integer, List<FileResponse>> filesMap =
                fileService.getActiveFilesMap(FileRefType.SPACE.dbValue(), spaceIds);

        return page.map(space -> {
            List<FileResponse> files = filesMap.getOrDefault(space.getSpaceId(), List.of());
            FileResponse firstImage = files.stream()
                    .filter(f -> f != null && isImageExt(f.getFileType()))
                    .findFirst().orElse(null);
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
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));

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

        if (request.getDeleteFileIds() != null && !request.getDeleteFileIds().isEmpty()) {
            fileService.softDeleteFilesByParent(
                    FileRefType.SPACE.dbValue(),
                    spaceId,
                    request.getDeleteFileIds()
            );
        }

        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
            fileService.uploadFiles(FileUploadRequest.builder()
                    .fileParentType(FileRefType.SPACE.dbValue())
                    .fileParentId(spaceId)
                    .files(request.getFiles())
                    .build());
        }

        if (request.getFileOrder() != null && !request.getFileOrder().isEmpty()) {
            fileService.updateFileOrder(FileRefType.SPACE.dbValue(), spaceId, request.getFileOrder());
        }

        CommonSpace saved = spaceRepository.save(space);

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.SPACE.dbValue(), spaceId);

        return SpaceDetailResponse.fromEntity(saved, files);
    }

    @Override
    public void deleteSpace(Integer spaceId) {

        CommonSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));

        spaceRepository.delete(space);
    }

    private Building resolveBuildingByName(String buildingNm) {

        List<Building> buildings = buildingRepository.findByBuildingNmAndDeleteYn(buildingNm, "N");

        if (buildings == null || buildings.isEmpty()) {
            throw new BusinessException(ErrorCode.BUILDING_NOT_FOUND);
        }

        if (buildings.size() > 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        return buildings.get(0);
    }
}



