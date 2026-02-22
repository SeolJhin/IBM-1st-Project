// 경로: org/myweb/uniplace/domain/reservation/application/SpaceReservationServiceImpl.java
package org.myweb.uniplace.domain.reservation.application;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.myweb.uniplace.domain.property.api.dto.request.SpaceSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceResponse;
import org.myweb.uniplace.domain.property.application.SpaceService;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.CommonSpace;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.myweb.uniplace.domain.property.repository.SpaceRepository;

import org.myweb.uniplace.domain.reservation.api.dto.request.CancelSpaceReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateSpaceReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservableResponse;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservationResponse;
import org.myweb.uniplace.domain.reservation.domain.entity.SpaceReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceFixedSlot;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;
import org.myweb.uniplace.domain.reservation.domain.policy.ReservationValidator;
import org.myweb.uniplace.domain.reservation.domain.policy.SpaceReservationConflictPolicy;
import org.myweb.uniplace.domain.reservation.repository.SpaceReservationRepository;

import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;
import org.myweb.uniplace.domain.user.repository.UserRepository;

import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SpaceReservationServiceImpl implements SpaceReservationService {

    private final SpaceReservationRepository spaceReservationRepository;
    private final BuildingRepository buildingRepository;
    private final SpaceRepository spaceRepository;

    private final SpaceService spaceService;
    private final UserRepository userRepository;

    private final ReservationValidator reservationValidator;
    private final SpaceReservationConflictPolicy spaceReservationConflictPolicy;

    private static final List<SpaceReservationStatus> INACTIVE =
            List.of(SpaceReservationStatus.cancelled, SpaceReservationStatus.ended);

    /* =========================
       ✅ RESERVABLE
       ========================= */

    @Override
    @Transactional(readOnly = true)
    public Page<SpaceReservableResponse> reservableSpaces(Integer buildingId, LocalDate date, Pageable pageable) {

        if (buildingId == null || date == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        buildingRepository.findById(buildingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST)); // BUILDING_NOT_FOUND 분리 가능

        SpaceSearchRequest request = SpaceSearchRequest.builder()
                .buildingId(buildingId)
                .build();

        Page<SpaceResponse> spaces = spaceService.searchPage(request, pageable);

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        // ✅ 반드시 Page 반환
        return spaces.map(s -> {
            Integer spaceId = s.getSpaceId();

            List<SpaceReservationEntity> reserved = spaceReservationRepository.findActiveInDayRange(
                    spaceId,
                    INACTIVE,
                    dayStart,
                    dayEnd
            );

            Set<String> reservedKeys = reserved.stream()
                    .map(e -> key(e.getSrStartAt(), e.getSrEndAt()))
                    .collect(Collectors.toSet());

            List<SpaceReservableResponse.TimeSlotResponse> available = Arrays.stream(SpaceFixedSlot.values())
                    .map(slot -> {
                        LocalDateTime startAt = LocalDateTime.of(date, slot.getStart());
                        LocalDateTime endAt = LocalDateTime.of(date, slot.getEnd());
                        return SpaceReservableResponse.TimeSlotResponse.builder()
                                .label(slot.label())
                                .startAt(startAt)
                                .endAt(endAt)
                                .build();
                    })
                    .filter(ts -> !reservedKeys.contains(key(ts.getStartAt(), ts.getEndAt())))
                    .toList();

            return SpaceReservableResponse.builder()
                    .buildingId(buildingId)
                    .spaceId(spaceId)
                    .spaceNm(s.getSpaceNm())
                    .availableSlots(available)
                    .build();
        });
    }

    /* =========================
       ✅ CREATE
       ========================= */

    @Override
    public SpaceReservationResponse create(AuthUser me, CreateSpaceReservationRequest request) {

        if (me == null || me.getUserId() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        User user = userRepository.findById(me.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // ✅ tenant만 예약 가능
        if (user.getUserRole() != UserRole.tenant) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (user.getUserSt() != UserStatus.active || "Y".equalsIgnoreCase(user.getDeleteYN())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (request == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        reservationValidator.validateSpaceTime(request.getSrStartAt(), request.getSrEndAt());
        reservationValidator.validateSpaceFixedSlot(request.getSrStartAt(), request.getSrEndAt());

        if (request.getSrNoPeople() == null || request.getSrNoPeople() < 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST)); // BUILDING_NOT_FOUND 분리 가능

        CommonSpace space = spaceRepository.findById(request.getSpaceId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST)); // SPACE_NOT_FOUND 분리 가능

        // ✅ 같은 building 소속인지 검증
        if (space.getBuilding() == null || !building.getBuildingId().equals(space.getBuilding().getBuildingId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST); // SPACE_RESERVATION_INVALID_TARGET 분리 가능
        }

        // ✅ 수용 인원 초과 방지
        if (space.getSpaceCapacity() != null && request.getSrNoPeople() > space.getSpaceCapacity()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST); // SPACE_RESERVATION_OVER_CAPACITY 분리 가능
        }

        // ✅ 시간 겹침 방지
        spaceReservationConflictPolicy.validateSpaceConflict(
                space.getSpaceId(),
                request.getSrStartAt(),
                request.getSrEndAt()
        );

        SpaceReservationEntity saved = spaceReservationRepository.save(
                SpaceReservationEntity.builder()
                        .building(building)
                        .space(space)
                        .user(user)
                        .srStartAt(request.getSrStartAt())
                        .srEndAt(request.getSrEndAt())
                        .srNoPeople(request.getSrNoPeople())
                        .srSt(SpaceReservationStatus.requested)
                        .build()
        );

        return SpaceReservationResponse.fromEntity(saved);
    }

    /* =========================
       ✅ USER CANCEL
       ========================= */

    @Override
    public SpaceReservationResponse cancel(AuthUser me, Integer reservationId) {

        if (me == null || me.getUserId() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        if (reservationId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        SpaceReservationEntity e = spaceReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST)); // SPACE_RESERVATION_NOT_FOUND 분리 가능

        // ✅ 본인 예약만 취소 가능
        if (e.getUser() == null || !me.getUserId().equals(e.getUser().getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 멱등 처리
        if (e.getSrSt() == SpaceReservationStatus.cancelled || e.getSrSt() == SpaceReservationStatus.ended) {
            return SpaceReservationResponse.fromEntity(e);
        }

        e.setSrSt(SpaceReservationStatus.cancelled);

        return SpaceReservationResponse.fromEntity(e);
    }

    /* =========================
       ✅ MY RESERVATIONS
       ========================= */

    @Override
    @Transactional(readOnly = true)
    public Page<SpaceReservationResponse> myReservations(AuthUser me, Pageable pageable) {

        if (me == null || me.getUserId() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Page<SpaceReservationEntity> page = spaceReservationRepository.findByUser_UserIdAndSrStNotIn(
                me.getUserId(),
                INACTIVE,
                pageable
        );

        return page.map(SpaceReservationResponse::fromEntity);
    }

    /* =========================
       ✅ ADMIN
       ========================= */

    @Override
    @Transactional(readOnly = true)
    public Page<SpaceReservationResponse> adminSearch(
            AuthUser me,
            Integer buildingId,
            Integer spaceId,
            String userId,
            LocalDate date,
            Pageable pageable
    ) {
        requireAdmin(me);

        LocalDateTime dayStart = null;
        LocalDateTime dayEnd = null;
        if (date != null) {
            dayStart = date.atStartOfDay();
            dayEnd = date.plusDays(1).atStartOfDay();
        }

        Page<SpaceReservationEntity> page = spaceReservationRepository.adminSearch(
                buildingId,
                spaceId,
                userId,
                dayStart,
                dayEnd,
                pageable
        );

        return page.map(SpaceReservationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public SpaceReservationResponse adminDetail(AuthUser me, Integer reservationId) {
        requireAdmin(me);
        if (reservationId == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        SpaceReservationEntity e = spaceReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        return SpaceReservationResponse.fromEntity(e);
    }

    @Override
    public SpaceReservationResponse adminConfirm(AuthUser me, Integer reservationId) {
        requireAdmin(me);
        if (reservationId == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        SpaceReservationEntity e = spaceReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        // 멱등
        if (e.getSrSt() == SpaceReservationStatus.confirmed) {
            return SpaceReservationResponse.fromEntity(e);
        }
        // 이미 종료/취소된 건 확정 불가
        if (e.getSrSt() == SpaceReservationStatus.cancelled || e.getSrSt() == SpaceReservationStatus.ended) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        e.setSrSt(SpaceReservationStatus.confirmed);
        return SpaceReservationResponse.fromEntity(e);
    }

    @Override
    public SpaceReservationResponse adminEnd(AuthUser me, Integer reservationId) {
        requireAdmin(me);
        if (reservationId == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        SpaceReservationEntity e = spaceReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        // 멱등
        if (e.getSrSt() == SpaceReservationStatus.ended) {
            return SpaceReservationResponse.fromEntity(e);
        }
        // 취소된 예약은 종료 처리 의미 없음
        if (e.getSrSt() == SpaceReservationStatus.cancelled) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        e.setSrSt(SpaceReservationStatus.ended);
        return SpaceReservationResponse.fromEntity(e);
    }

    @Override
    public SpaceReservationResponse adminCancel(AuthUser me, Integer reservationId, CancelSpaceReservationRequest request) {
        requireAdmin(me);
        if (reservationId == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        SpaceReservationEntity e = spaceReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        // 멱등
        if (e.getSrSt() == SpaceReservationStatus.cancelled) {
            return SpaceReservationResponse.fromEntity(e);
        }
        // 종료된 예약은 취소 불가(정책에 따라 바꿀 수 있음)
        if (e.getSrSt() == SpaceReservationStatus.ended) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        // request.getCancelReason()는 로그용으로만 사용 가능(저장 컬럼 없으니)
        e.setSrSt(SpaceReservationStatus.cancelled);
        return SpaceReservationResponse.fromEntity(e);
    }

    private void requireAdmin(AuthUser me) {
        if (me == null || me.getUserId() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        User user = userRepository.findById(me.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getUserRole() != UserRole.admin) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (user.getUserSt() != UserStatus.active || "Y".equalsIgnoreCase(user.getDeleteYN())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private static String key(LocalDateTime startAt, LocalDateTime endAt) {
        return startAt + "|" + endAt;
    }
}