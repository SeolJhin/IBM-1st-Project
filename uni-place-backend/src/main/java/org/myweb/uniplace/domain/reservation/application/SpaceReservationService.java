// 경로: org/myweb/uniplace/domain/reservation/application/SpaceReservationService.java
package org.myweb.uniplace.domain.reservation.application;

import java.time.LocalDate;

import org.myweb.uniplace.domain.reservation.api.dto.request.CancelSpaceReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateSpaceReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservableResponse;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservationResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SpaceReservationService {

    Page<SpaceReservableResponse> reservableSpaces(Integer buildingId, LocalDate date, Pageable pageable);

    SpaceReservationResponse create(AuthUser me, CreateSpaceReservationRequest request);

    SpaceReservationResponse cancel(AuthUser me, Integer reservationId);

    Page<SpaceReservationResponse> myReservations(AuthUser me, Pageable pageable);

    /* =========================
       ✅ ADMIN
       ========================= */
    Page<SpaceReservationResponse> adminSearch(
            AuthUser me,
            Integer buildingId,
            Integer spaceId,
            String userId,
            LocalDate date,
            Pageable pageable
    );

    SpaceReservationResponse adminDetail(AuthUser me, Integer reservationId);

    SpaceReservationResponse adminConfirm(AuthUser me, Integer reservationId);

    SpaceReservationResponse adminEnd(AuthUser me, Integer reservationId);

    SpaceReservationResponse adminCancel(AuthUser me, Integer reservationId, CancelSpaceReservationRequest request);
}