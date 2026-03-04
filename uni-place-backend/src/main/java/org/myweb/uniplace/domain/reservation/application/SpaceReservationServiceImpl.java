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
import org.myweb.uniplace.domain.contract.repository.ContractRepository;

import org.myweb.uniplace.domain.reservation.api.dto.request.CancelSpaceReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateSpaceReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservableResponse;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservationResponse;
import org.myweb.uniplace.domain.reservation.domain.entity.SpaceReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceFixedSlot;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;
import org.myweb.uniplace.domain.reservation.domain.policy.ReservationValidator;
import org.myweb.uniplace.domain.reservation.domain.policy.SpaceReservationConflictPolicy;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.reservation.repository.SpaceReservationRepository;

import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;
import org.myweb.uniplace.domain.user.repository.UserRepository;

import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;

import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.AuthUser;
import org.myweb.uniplace.global.slack.SlackNotificationService;
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
    private final ContractRepository contractRepository;

    private final SpaceService spaceService;
    private final UserRepository userRepository;

    private final ReservationValidator reservationValidator;
    private final SpaceReservationConflictPolicy spaceReservationConflictPolicy;

    // ✅ 알림
    private final NotificationService notificationService;
    private final SlackNotificationService slackNotificationService;

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

        Building reservableBuilding = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        // ✅ 삭제된 건물의 공간 예약 가능 목록 조회 불가
        if (reservableBuilding.isDeleted()) {
            throw new BusinessException(ErrorCode.BUILDING_NOT_FOUND);
        }

        SpaceSearchRequest request = SpaceSearchRequest.builder()
                .buildingId(buildingId)
                .build();

        Page<SpaceResponse> spaces = spaceService.searchPage(request, pageable);

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

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
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_TENANT_ONLY);
        }
        if (user.getUserSt() != UserStatus.active || "Y".equalsIgnoreCase(user.getDeleteYN())) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_USER_INACTIVE);
        }

        // ✅ 같은 건물에 active 계약이 있는 입주자만 예약 가능
        boolean hasActiveContract = contractRepository.existsActiveContractByUserAndBuilding(
                me.getUserId(), request.getBuildingId(), ContractStatus.active
        );
        if (!hasActiveContract) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_BUILDING_MISMATCH);
        }

        if (request == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        reservationValidator.validateSpaceTime(request.getSrStartAt(), request.getSrEndAt());
        reservationValidator.validateSpaceFixedSlot(request.getSrStartAt(), request.getSrEndAt());

        if (request.getSrNoPeople() == null || request.getSrNoPeople() < 1) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_PEOPLE_INVALID);
        }

        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BUILDING_NOT_FOUND));

        // ✅ 삭제된 건물로 공간 예약 불가
        if (building.isDeleted()) {
            throw new BusinessException(ErrorCode.BUILDING_NOT_FOUND);
        }

        CommonSpace space = spaceRepository.findById(request.getSpaceId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));

        if (space.getBuilding() == null || !building.getBuildingId().equals(space.getBuilding().getBuildingId())) {
            throw new BusinessException(ErrorCode.SPACE_BUILDING_MISMATCH);
        }

        if (space.getSpaceCapacity() != null && request.getSrNoPeople() > space.getSpaceCapacity()) {
            throw new BusinessException(ErrorCode.SPACE_CAPACITY_EXCEEDED);
        }

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

        // =========================
        // 알림(여기 라인에 넣기) - 예약 생성 직후
        // =========================
        String timeMsg = saved.getSrStartAt() + " ~ " + saved.getSrEndAt();

        // 1) 사용자 알림
        notificationService.notifyUser(
                user.getUserId(),
                NotificationType.SP_REQ.name(),
                "공간 예약 요청이 접수되었습니다. (" + timeMsg + ")",
                null,
                TargetType.space,
                saved.getReservationId(),
                "/space-reservations/my"
        );

        // 2) 관리자 알림
        notificationService.notifyAdmins(
                NotificationType.SP_REQ.name(),
                "공간 예약 요청이 생성되었습니다. userId=" + user.getUserId()
                        + ", buildingId=" + building.getBuildingId()
                        + ", spaceId=" + space.getSpaceId()
                        + ", time=" + timeMsg,
                user.getUserId(),
                TargetType.space,
                saved.getReservationId(),
                "/admin/space-reservations"
        );
        
        slackNotificationService.sendSpaceReservationAlert(
        	    saved.getReservationId(),
        	    user.getUserId(),
        	    space.getSpaceNm(),
        	    timeMsg
        );

        return SpaceReservationResponse.fromEntity(saved);
    }

    /* =========================
        USER CANCEL
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
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        if (e.getUser() == null || !me.getUserId().equals(e.getUser().getUserId())) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_ACCESS_DENIED);
        }

        if (e.getSrSt() == SpaceReservationStatus.cancelled || e.getSrSt() == SpaceReservationStatus.ended) {
            return SpaceReservationResponse.fromEntity(e);
        }

        e.setSrSt(SpaceReservationStatus.cancelled);

        // =========================
        // ✅ 알림(여기 라인에 넣기) - 사용자 취소 직후
        // =========================
        String timeMsg = e.getSrStartAt() + " ~ " + e.getSrEndAt();

        // 1) 사용자 알림(자기 취소 확인)
        notificationService.notifyUser(
                e.getUser().getUserId(),
                NotificationType.SP_CAN.name(),
                "공간 예약이 취소되었습니다. (" + timeMsg + ")",
                null,
                TargetType.space,
                e.getReservationId(),
                "/space-reservations/my"
        );

        // 2) 관리자 알림
        notificationService.notifyAdmins(
                NotificationType.SP_CAN.name(),
                "사용자가 공간 예약을 취소했습니다. userId=" + e.getUser().getUserId()
                        + ", reservationId=" + e.getReservationId()
                        + ", time=" + timeMsg,
                e.getUser().getUserId(),
                TargetType.space,
                e.getReservationId(),
                "/admin/space-reservations"
        );

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

        Page<SpaceReservationEntity> page = spaceReservationRepository.findByUser_UserId(
                me.getUserId(),
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
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RESERVATION_NOT_FOUND));

        return SpaceReservationResponse.fromEntity(e);
    }

    @Override
    public SpaceReservationResponse adminConfirm(AuthUser me, Integer reservationId) {
        requireAdmin(me);
        if (reservationId == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        SpaceReservationEntity e = spaceReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RESERVATION_NOT_FOUND));

        if (e.getSrSt() == SpaceReservationStatus.confirmed) {
            return SpaceReservationResponse.fromEntity(e);
        }
        if (e.getSrSt() == SpaceReservationStatus.cancelled || e.getSrSt() == SpaceReservationStatus.ended) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_CANNOT_CANCEL);
        }

        e.setSrSt(SpaceReservationStatus.confirmed);

        // =========================
        // 알림 - 관리자 확정 직후
        // =========================
        String timeMsg = e.getSrStartAt() + " ~ " + e.getSrEndAt();

        notificationService.notifyUser(
                e.getUser().getUserId(),
                NotificationType.SP_CFM.name(),
                "공간 예약이 확정되었습니다. (" + timeMsg + ")",
                me.getUserId(), // sender=admin
                TargetType.space,
                e.getReservationId(),
                "/space-reservations/my"
        );

        return SpaceReservationResponse.fromEntity(e);
    }

    @Override
    public SpaceReservationResponse adminEnd(AuthUser me, Integer reservationId) {
        requireAdmin(me);
        if (reservationId == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        SpaceReservationEntity e = spaceReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RESERVATION_NOT_FOUND));

        if (e.getSrSt() == SpaceReservationStatus.ended) {
            return SpaceReservationResponse.fromEntity(e);
        }
        if (e.getSrSt() == SpaceReservationStatus.cancelled) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_CANNOT_CANCEL);
        }

        e.setSrSt(SpaceReservationStatus.ended);

        // 종료 알림을 원하면 여기서 NotificationType 하나 더 추가해서 보내면 됨

        return SpaceReservationResponse.fromEntity(e);
    }

    @Override
    public SpaceReservationResponse adminCancel(AuthUser me, Integer reservationId, CancelSpaceReservationRequest request) {
        requireAdmin(me);
        if (reservationId == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        SpaceReservationEntity e = spaceReservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RESERVATION_NOT_FOUND));

        if (e.getSrSt() == SpaceReservationStatus.cancelled) {
            return SpaceReservationResponse.fromEntity(e);
        }
        if (e.getSrSt() == SpaceReservationStatus.ended) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_CANNOT_CANCEL);
        }

        e.setSrSt(SpaceReservationStatus.cancelled);

        // =========================
        // 알람 -관리자 취소 직후
        // =========================
        String timeMsg = e.getSrStartAt() + " ~ " + e.getSrEndAt();
        String reason = (request != null && request.getCancelReason() != null && !request.getCancelReason().isBlank())
                ? " 사유: " + request.getCancelReason()
                : "";

        notificationService.notifyUser(
                e.getUser().getUserId(),
                NotificationType.SP_CAN.name(),
                "관리자에 의해 공간 예약이 취소되었습니다. (" + timeMsg + ")" + reason,
                me.getUserId(),
                TargetType.space,
                e.getReservationId(),
                "/space-reservations/my"
        );

        return SpaceReservationResponse.fromEntity(e);
    }

    private void requireAdmin(AuthUser me) {
        if (me == null || me.getUserId() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        User user = userRepository.findById(me.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.getUserRole() != UserRole.admin) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_TENANT_ONLY);
        }
        if (user.getUserSt() != UserStatus.active || "Y".equalsIgnoreCase(user.getDeleteYN())) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_USER_INACTIVE);
        }
    }

    private static String key(LocalDateTime startAt, LocalDateTime endAt) {
        return startAt + "|" + endAt;
    }
}