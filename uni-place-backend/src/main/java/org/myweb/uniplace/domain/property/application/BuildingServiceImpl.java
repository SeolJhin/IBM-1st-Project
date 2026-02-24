// 경로: org/myweb/uniplace/domain/property/application/BuildingServiceImpl.java
package org.myweb.uniplace.domain.property.application;

import java.util.List;
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

    // ✅ 일반 사용자: 삭제된 건물 조회 불가
    @Override
    @Transactional(readOnly = true)
    public BuildingDetailResponse getBuilding(Integer buildingId) {

        Building building = buildingRepository.findByBuildingIdAndDeleteYn(buildingId, "N")
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), buildingId);

        return BuildingDetailResponse.fromEntity(building, files);
    }

    // ✅ 관리자: 삭제된 건물도 조회 가능 (findById 그대로 유지)
    @Override
    @Transactional(readOnly = true)
    public BuildingDetailResponse getBuildingForAdmin(Integer buildingId) {

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        List<FileResponse> files =
                fileService.getAllFilesForAdmin(FileRefType.BUILDING.dbValue(), buildingId);

        return BuildingDetailResponse.fromEntity(building, files);
    }

    // ✅ 일반 사용자: 삭제된 건물 목록 제외
    @Override
    @Transactional(readOnly = true)
    public Page<BuildingSummaryResponse> searchPage(Pageable pageable) {

        Page<Building> page = buildingRepository.findAllByDeleteYn("N", pageable);

        return page.map(b -> {
            List<FileResponse> files =
                    fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), b.getBuildingId());

            FileResponse firstImage = null;
            if (files != null) {
                for (FileResponse f : files) {
                    if (f != null && isImageExt(f.getFileType())) {
                        firstImage = f;
                        break;
                    }
                }
            }

            Integer thumbId  = (firstImage != null ? firstImage.getFileId()  : null);
            String  thumbUrl = (firstImage != null ? firstImage.getViewUrl() : null);

            return BuildingSummaryResponse.fromEntity(b, thumbId, thumbUrl);
        });
    }

    @Override
    public BuildingDetailResponse createBuilding(BuildingCreateRequest request) {

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

        // ✅ 수정도 삭제된 건물은 불가
        Building building = buildingRepository.findByBuildingIdAndDeleteYn(buildingId, "N")
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        if (request == null) {
            List<FileResponse> files =
                    fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), buildingId);
            return BuildingDetailResponse.fromEntity(building, files);
        }

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

    // ✅ soft delete: building + 연결된 모든 room 을 함께 논리 삭제
    @Override
    public void deleteBuilding(Integer buildingId) {

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        // 이미 삭제된 건물이면 그냥 리턴 (멱등성 보장)
        if (building.isDeleted()) {
            return;
        }

        // 연결된 Room 들을 먼저 soft delete
        List<Room> rooms = building.getRooms();
        if (rooms != null) {
            rooms.forEach(Room::softDelete);
        }

        // Building soft delete
        building.softDelete();

        buildingRepository.save(building);
    }
}
