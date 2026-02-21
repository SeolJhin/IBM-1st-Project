// 경로: org/myweb/uniplace/domain/reservation/application/TourReservationServiceImpl.java
package org.myweb.uniplace.domain.reservation.application;

import java.util.List;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
import org.myweb.uniplace.domain.reservation.api.dto.request.CancelTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.LookupTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservationResponse;
import org.myweb.uniplace.domain.reservation.domain.entity.TourReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;
import org.myweb.uniplace.domain.reservation.domain.policy.ReservationConflictPolicy;
import org.myweb.uniplace.domain.reservation.domain.policy.ReservationValidator;
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
    private final ReservationConflictPolicy reservationConflictPolicy;

    private static final List<TourStatus> INACTIVE = List.of(TourStatus.cancelled, TourStatus.ended);

    @Override
    public TourReservationResponse create(CreateTourReservationRequest request) {

        reservationValidator.validateTourTime(request.getTourStartAt(), request.getTourEndAt());

        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST)); //BUILDING_NOT_FOUND

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        // ✅ room이 building 소속인지 체크
        if (room.getBuilding() == null || !building.getBuildingId().equals(room.getBuilding().getBuildingId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST); //TOUR_RESERVATION_INVALID_TARGET
        }

        // ✅ room 상태가 available인지 검증 (프론트 실수/조작 방지)
        if (room.getRoomSt() != RoomStatus.available) {
            throw new BusinessException(ErrorCode.BAD_REQUEST); //TOUR_RESERVATION_ROOM_NOT_AVAILABLE
        }

        // ✅ 같은 방 시간 겹침 방지
        reservationConflictPolicy.validateRoomConflict(
                room.getRoomId(),
                request.getTourStartAt(),
                request.getTourEndAt()
        );

        // ✅ 같은 전화번호 + 동일 시간(start/end 동일) 중복 방지
        reservationConflictPolicy.validateDuplicateTelTime(
                request.getTourTel(),
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
            throw new BusinessException(ErrorCode.BAD_REQUEST);//TOUR_RESERVATION_AUTH_FAILED
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
            throw new BusinessException(ErrorCode.BAD_REQUEST);//TOUR_RESERVATION_AUTH_FAILED
        }

        if (resv.getTourSt() == TourStatus.cancelled) {
            return TourReservationResponse.fromEntity(resv);
        }
        if (resv.getTourSt() == TourStatus.ended) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);//TOUR_RESERVATION_ALREADY_ENDED
        }

        resv.setTourSt(TourStatus.cancelled);
        return TourReservationResponse.fromEntity(resv);
    }
}