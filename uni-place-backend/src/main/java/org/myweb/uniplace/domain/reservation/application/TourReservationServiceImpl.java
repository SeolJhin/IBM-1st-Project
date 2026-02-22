// ServiceImpl (✅ 고정슬롯 적용)
// 경로: org/myweb/uniplace/domain/reservation/application/TourReservationServiceImpl.java
package org.myweb.uniplace.domain.reservation.application;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.myweb.uniplace.domain.property.repository.RoomRepository;

import org.myweb.uniplace.domain.reservation.api.dto.request.CancelTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.LookupTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservableResponse;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservationResponse;
import org.myweb.uniplace.domain.reservation.domain.entity.TourReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.TourFixedSlot;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;
import org.myweb.uniplace.domain.reservation.domain.policy.ReservationValidator;
import org.myweb.uniplace.domain.reservation.domain.policy.TourReservationConflictPolicy;
import org.myweb.uniplace.domain.reservation.repository.TourReservationRepository;

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
public class TourReservationServiceImpl implements TourReservationService {

    private final TourReservationRepository tourReservationRepository;
    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;

    private final ReservationValidator reservationValidator;
    private final TourReservationConflictPolicy reservationConflictPolicy;

    private static final List<TourStatus> INACTIVE = List.of(TourStatus.cancelled, TourStatus.ended);

    @Override
    public TourReservationResponse create(CreateTourReservationRequest request) {

        if (request == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        //  시간 기본 검증 +  고정 슬롯 검증
        reservationValidator.validateTourTime(request.getTourStartAt(), request.getTourEndAt());
        reservationValidator.validateTourFixedSlot(request.getTourStartAt(), request.getTourEndAt());

        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        // room이 building 소속인지 체크
        if (room.getBuilding() == null || !building.getBuildingId().equals(room.getBuilding().getBuildingId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        // 빈방(available)만 투어예약 허용
        if (room.getRoomSt() != RoomStatus.available) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        // 같은 전화번호가 같은 시간(슬롯) 중복 예약 방지
        reservationConflictPolicy.validateDuplicateTelTime(
                request.getTourTel(),
                request.getTourStartAt(),
                request.getTourEndAt()
        );

        // 같은 방 시간 겹침 방지
        reservationConflictPolicy.validateRoomConflict(
                room.getRoomId(),
                request.getTourStartAt(),
                request.getTourEndAt()
        );

        TourReservationEntity saved = tourReservationRepository.save(
                TourReservationEntity.builder()
                        .building(building)
                        .room(room)
                        .tourStartAt(request.getTourStartAt())
                        .tourEndAt(request.getTourEndAt())
                        .tourNm(request.getTourNm())
                        .tourTel(request.getTourTel())
                        .tourPwd(request.getTourPwd())
                        .tourSt(TourStatus.requested)
                        .build()
        );

        return TourReservationResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TourReservationResponse> lookup(LookupTourReservationRequest request, Pageable pageable) {

        Page<TourReservationEntity> page = tourReservationRepository.findByTourTelAndTourPwdAndTourStNotIn(
                request.getTourTel(),
                request.getTourPwd(),
                INACTIVE,
                pageable
        );

        if (page.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        return page.map(TourReservationResponse::fromEntity);
    }

    @Override
    public TourReservationResponse cancel(Integer tourId, CancelTourReservationRequest request) {

        TourReservationEntity resv = tourReservationRepository.findByTourIdAndTourTelAndTourPwd(
                tourId,
                request.getTourTel(),
                request.getTourPwd()
        );

        if (resv == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        if (resv.getTourSt() == TourStatus.cancelled) {
            return TourReservationResponse.fromEntity(resv);
        }
        if (resv.getTourSt() == TourStatus.ended) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        resv.setTourSt(TourStatus.cancelled);
        return TourReservationResponse.fromEntity(resv);
    }

    @Override
    @Transactional(readOnly = true)
    public TourReservableResponse reservableSlots(Integer buildingId, Integer roomId, LocalDate date) {

        if (buildingId == null || roomId == null || date == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.getBuilding() == null || !building.getBuildingId().equals(room.getBuilding().getBuildingId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        List<TourReservationEntity> reserved = tourReservationRepository.findActiveInDayRange(
                roomId, INACTIVE, dayStart, dayEnd
        );

        Set<String> reservedKeys = reserved.stream()
                .map(e -> key(e.getTourStartAt(), e.getTourEndAt()))
                .collect(Collectors.toSet());

        List<TourReservableResponse.TimeSlotResponse> available = Arrays.stream(TourFixedSlot.values())
                .map(slot -> {
                    LocalDateTime startAt = LocalDateTime.of(date, slot.getStart());
                    LocalDateTime endAt = LocalDateTime.of(date, slot.getEnd());
                    return TourReservableResponse.TimeSlotResponse.builder()
                            .label(slot.label())
                            .startAt(startAt)
                            .endAt(endAt)
                            .build();
                })
                .filter(ts -> !reservedKeys.contains(key(ts.getStartAt(), ts.getEndAt())))
                .toList();

        return TourReservableResponse.builder()
                .buildingId(buildingId)
                .roomId(roomId)
                .availableSlots(available)
                .build();
    }

    private static String key(LocalDateTime startAt, LocalDateTime endAt) {
        return startAt + "|" + endAt;
    }
}