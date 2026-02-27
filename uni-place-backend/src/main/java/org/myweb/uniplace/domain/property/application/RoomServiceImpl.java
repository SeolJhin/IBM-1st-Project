package org.myweb.uniplace.domain.property.application;

import java.util.List;
import java.util.Set;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.file.domain.enums.FileRefType;
import org.myweb.uniplace.domain.property.api.dto.request.RoomCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.request.RoomUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.RoomDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
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
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
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
    public RoomDetailResponse getRoom(Integer roomId) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.isDeleted()) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.ROOM.dbValue(), roomId);

        return RoomDetailResponse.fromEntity(room, files);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomDetailResponse getRoomForAdmin(Integer roomId) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        List<FileResponse> files =
                fileService.getAllFilesForAdmin(FileRefType.ROOM.dbValue(), roomId);

        return RoomDetailResponse.fromEntity(room, files);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomSummaryResponse> searchPage(RoomSearchRequest request, Pageable pageable) {

        Page<Room> page = roomRepository.searchWithFilters(
                request.getBuildingId(),
                request.getBuildingNm(),
                request.getBuildingAddr(),
                request.getMinParkingCapacity(),

                request.getRoomNo(),
                request.getFloor(),

                request.getMinRoomSize(),
                request.getMaxRoomSize(),

                request.getRoomType(),
                request.getPetAllowedYn(),

                request.getMinDeposit(),
                request.getMaxDeposit(),

                request.getMinRentPrice(),
                request.getMaxRentPrice(),

                request.getMinManageFee(),
                request.getMaxManageFee(),

                request.getRentType(),
                request.getRoomSt(),
                request.getSunDirection(),

                request.getMinRoomCapacity(),
                request.getMaxRoomCapacity(),

                request.getMinRentMin(),
                request.getMaxRentMin(),

                request.getRoomOptions(),

                pageable
        );

        return page.map(room -> {
            List<FileResponse> files =
                    fileService.getActiveFiles(FileRefType.ROOM.dbValue(), room.getRoomId());

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

            return RoomSummaryResponse.fromEntity(room, thumbId, thumbUrl);
        });
    }

    @Override
    public RoomDetailResponse createRoom(RoomCreateRequest request) {

        Building building = resolveBuildingByName(request.getBuildingNm());

        Room room = Room.builder()
                .building(building)
                .roomNo(request.getRoomNo())
                .floor(request.getFloor())
                .roomSize(request.getRoomSize())
                .roomType(request.getRoomType())
                .petAllowedYn(request.getPetAllowedYn())
                .deposit(request.getDeposit())
                .rentPrice(request.getRentPrice())
                .manageFee(request.getManageFee())
                .rentType(request.getRentType())
                .roomSt(request.getRoomSt())
                .roomOptions(request.getRoomOptions())
                .roomCapacity(request.getRoomCapacity())
                .rentMin(request.getRentMin())
                .sunDirection(request.getSunDirection())
                .roomDesc(request.getRoomDesc())
                .build();

        Room saved = roomRepository.save(room);

        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
            fileService.uploadFiles(FileUploadRequest.builder()
                    .fileParentType(FileRefType.ROOM.dbValue())
                    .fileParentId(saved.getRoomId())
                    .files(request.getFiles())
                    .build());
        }

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.ROOM.dbValue(), saved.getRoomId());

        return RoomDetailResponse.fromEntity(saved, files);
    }

    @Override
    public RoomDetailResponse updateRoom(Integer roomId, RoomUpdateRequest request) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.isDeleted()) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        if (request.getBuildingNm() != null && !request.getBuildingNm().isBlank()) {
            room.setBuilding(resolveBuildingByName(request.getBuildingNm()));
        }

        if (request.getRoomNo() != null)       room.setRoomNo(request.getRoomNo());
        if (request.getFloor() != null)         room.setFloor(request.getFloor());
        if (request.getRoomSize() != null)      room.setRoomSize(request.getRoomSize());
        if (request.getRoomType() != null)      room.setRoomType(request.getRoomType());
        if (request.getPetAllowedYn() != null)  room.setPetAllowedYn(request.getPetAllowedYn());

        if (request.getDeposit() != null)       room.setDeposit(request.getDeposit());
        if (request.getRentPrice() != null)     room.setRentPrice(request.getRentPrice());
        if (request.getManageFee() != null)     room.setManageFee(request.getManageFee());

        if (request.getRentType() != null)      room.setRentType(request.getRentType());
        if (request.getRoomSt() != null)        room.setRoomSt(request.getRoomSt());

        if (request.getRoomOptions() != null)   room.setRoomOptions(request.getRoomOptions());
        if (request.getRoomCapacity() != null)  room.setRoomCapacity(request.getRoomCapacity());
        if (request.getRentMin() != null)       room.setRentMin(request.getRentMin());

        if (request.getSunDirection() != null)  room.setSunDirection(request.getSunDirection());
        if (request.getRoomDesc() != null)      room.setRoomDesc(request.getRoomDesc());

        if (request.getDeleteFileIds() != null && !request.getDeleteFileIds().isEmpty()) {
            fileService.softDeleteFilesByParent(
                    FileRefType.ROOM.dbValue(),
                    roomId,
                    request.getDeleteFileIds()
            );
        }

        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
            fileService.uploadFiles(FileUploadRequest.builder()
                    .fileParentType(FileRefType.ROOM.dbValue())
                    .fileParentId(roomId)
                    .files(request.getFiles())
                    .build());
        }

        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.ROOM.dbValue(), roomId);

        return RoomDetailResponse.fromEntity(room, files);
    }

    @Override
    public void changeRoomStatus(Integer roomId, RoomStatus roomStatus) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.isDeleted()) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        room.setRoomSt(roomStatus);
    }

    @Override
    public void deleteRoom(Integer roomId) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.isDeleted()) {
            return;
        }

        room.softDelete();
        roomRepository.save(room);
    }

    private Building resolveBuildingByName(String buildingNm) {

        List<Building> buildings = buildingRepository.findByBuildingNmAndDeleteYn(buildingNm, "N");

        if (buildings == null || buildings.isEmpty()) {
            throw new BusinessException(ErrorCode.BUILDING_NOT_FOUND);
        }

        if (buildings.size() > 1) {
            throw new IllegalArgumentException("건물명이 중복됩니다. buildingNm=" + buildingNm + " (buildingId로 지정 필요)");
        }

        return buildings.get(0);
    }
}


