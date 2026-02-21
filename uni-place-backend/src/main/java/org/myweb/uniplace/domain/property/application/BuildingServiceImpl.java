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
import org.myweb.uniplace.domain.property.repository.BuildingRepository;

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

    // ✅ Room/Space와 동일하게 파일 서비스 사용
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

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "건물을 찾을 수 없습니다. buildingId=" + buildingId
                ));

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), buildingId);

        return BuildingDetailResponse.fromEntity(building, files);
    }

    @Override
    @Transactional(readOnly = true)
    public BuildingDetailResponse getBuildingForAdmin(Integer buildingId) {

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "건물을 찾을 수 없습니다. buildingId=" + buildingId
                ));

        List<FileResponse> files =
                fileService.getAllFilesForAdmin(FileRefType.BUILDING.dbValue(), buildingId);

        return BuildingDetailResponse.fromEntity(building, files);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BuildingSummaryResponse> searchPage(Pageable pageable) {

        Page<Building> page = buildingRepository.findAll(pageable);

        //첫 번째 이미지 파일을 썸네일로
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

            Integer thumbId = (firstImage != null ? firstImage.getFileId() : null);
            String thumbUrl = (firstImage != null ? firstImage.getViewUrl() : null);

            return BuildingSummaryResponse.fromEntity(b, thumbId, thumbUrl);
        });
    }

    @Override
    public BuildingDetailResponse createBuilding(BuildingCreateRequest request) {

        // ✅ building_nm UNIQUE 정책 제거: 중복명 허용 (선 체크 제거)

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

        // ✅ 파일 업로드
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

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "건물을 찾을 수 없습니다. buildingId=" + buildingId
                ));

        if (request == null) {
            List<FileResponse> files =
                    fileService.getActiveFiles(FileRefType.BUILDING.dbValue(), buildingId);
            return BuildingDetailResponse.fromEntity(building, files);
        }

        // ✅ 엔티티 update 메서드 활용(너가 올린 Building.java의 update 그대로 사용)
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

        // ✅ 삭제 파일 처리(soft delete)
        if (request.getDeleteFileIds() != null && !request.getDeleteFileIds().isEmpty()) {
            fileService.softDeleteFilesByParent(
                    FileRefType.BUILDING.dbValue(),
                    buildingId,
                    request.getDeleteFileIds()
            );
        }

        // ✅ 새 파일 업로드
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
                .orElseThrow(() -> new IllegalArgumentException(
                        "건물을 찾을 수 없습니다. buildingId=" + buildingId
                ));

        buildingRepository.delete(building);
    }
}