// 경로: org/myweb/uniplace/domain/property/application/BuildingServiceImpl.java
package org.myweb.uniplace.domain.property.application;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Set;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.file.domain.enums.FileRefType;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingSummaryResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
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
public class BuildingServiceImpl implements BuildingService {

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
    public BuildingDetailResponse getBuilding(Integer buildingId) {
        Building building = buildingRepository.findByBuildingIdAndDeleteYn(buildingId, "N")
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));
        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), buildingId);
        return BuildingDetailResponse.fromEntity(building, files);
    }

    @Override
    @Transactional(readOnly = true)
    public BuildingDetailResponse getBuildingForAdmin(Integer buildingId) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));
        List<FileResponse> files =
                fileService.getAllFilesForAdmin(FileRefType.BUILDING.dbValue(), buildingId);
        return BuildingDetailResponse.fromEntity(building, files);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BuildingSummaryResponse> searchPage(Pageable pageable) {
        Page<Building> page = buildingRepository.findAllByDeleteYn("N", pageable);
        List<Integer> buildingIds = page.getContent().stream()
                .map(Building::getBuildingId).toList();
        Map<Integer, List<FileResponse>> filesMap =
                fileService.getActiveFilesMap(FileRefType.BUILDING.dbValue(), buildingIds);

        return page.map(b -> {
            List<FileResponse> files = filesMap.getOrDefault(b.getBuildingId(), List.of());
            FileResponse firstImage = files.stream()
                    .filter(f -> f != null && isImageExt(f.getFileType()))
                    .findFirst().orElse(null);
            Integer thumbId  = (firstImage != null ? firstImage.getFileId()  : null);
            String  thumbUrl = (firstImage != null ? firstImage.getViewUrl() : null);
            return BuildingSummaryResponse.fromEntity(b, thumbId, thumbUrl);
        });
    }

    @Override
    public BuildingDetailResponse createBuilding(BuildingCreateRequest request) {
        List<Building> existing = buildingRepository.findByBuildingNmAndDeleteYn(request.getBuildingNm(), "N");
        if (existing != null && !existing.isEmpty()) {
            throw new BusinessException(ErrorCode.BUILDING_DUPLICATE);
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
                .buildingLessorNm(request.getBuildingLessorNm())
                .buildingLessorTel(request.getBuildingLessorTel())
                .buildingLessorAddr(request.getBuildingLessorAddr())
                .buildingLessorRrn(request.getBuildingLessorRrn())
                .build();

        Building saved = buildingRepository.save(building);

        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
            fileService.uploadFiles(FileUploadRequest.builder()
                    .fileParentType(FileRefType.BUILDING.dbValue())
                    .fileParentId(saved.getBuildingId())
                    .files(request.getFiles())
                    .build());
        }

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), saved.getBuildingId());
        return BuildingDetailResponse.fromEntity(saved, files);
    }

    @Override
    public BuildingDetailResponse updateBuilding(Integer buildingId, BuildingUpdateRequest request) {
        Building building = buildingRepository.findByBuildingIdAndDeleteYn(buildingId, "N")
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        if (request == null) {
            List<FileResponse> files =
                    fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), buildingId);
            return BuildingDetailResponse.fromEntity(building, files);
        }

        String newNm = request.getBuildingNm();
        if (newNm != null && !newNm.isBlank() && !newNm.equals(building.getBuildingNm())) {
            List<Building> existing = buildingRepository.findByBuildingNmAndDeleteYn(newNm, "N");
            if (existing != null && !existing.isEmpty()) {
                throw new BusinessException(ErrorCode.BUILDING_DUPLICATE);
            }
        }

        building.update(
                request.getBuildingNm(),
                request.getBuildingAddr(),
                request.getBuildingDesc(),
                request.getLandCategory(),
                request.getBuildSize(),
                request.getBuildingUsage(),
                request.getExistElv(),
                request.getParkingCapacity(),
                request.getBuildingLessorNm(),
                request.getBuildingLessorTel(),
                request.getBuildingLessorAddr(),
                request.getBuildingLessorRrn()
        );

        if (request.getDeleteFileIds() != null && !request.getDeleteFileIds().isEmpty()) {
            fileService.softDeleteFilesByParent(
                    FileRefType.BUILDING.dbValue(),
                    buildingId,
                    request.getDeleteFileIds()
            );
        }

        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
            fileService.uploadFiles(FileUploadRequest.builder()
                    .fileParentType(FileRefType.BUILDING.dbValue())
                    .fileParentId(buildingId)
                    .files(request.getFiles())
                    .build());
        }

        Building saved = buildingRepository.save(building);
        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), buildingId);
        return BuildingDetailResponse.fromEntity(saved, files);
    }

    @Override
    public void deleteBuilding(Integer buildingId) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));
        if (building.isDeleted()) return;
        List<Room> rooms = building.getRooms();
        if (rooms != null) {
            rooms.forEach(Room::softDelete);
        }
        building.softDelete();
        buildingRepository.save(building);
    }
}
