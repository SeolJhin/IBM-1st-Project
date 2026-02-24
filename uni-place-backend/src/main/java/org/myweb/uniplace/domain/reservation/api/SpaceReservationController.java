// 경로: org/myweb/uniplace/domain/reservation/api/SpaceReservationController.java
package org.myweb.uniplace.domain.reservation.api;

import java.time.LocalDate;

import org.myweb.uniplace.domain.reservation.api.dto.request.CreateSpaceReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservableResponse;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservationResponse;
import org.myweb.uniplace.domain.reservation.application.SpaceReservationService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/space-reservations")
public class SpaceReservationController {

    private final SpaceReservationService spaceReservationService;

    // ✅ 건물 -> 공용공간 + 예약가능(고정) 시간대 조회
    // 예) /space-reservations/spaces?buildingId=1&date=2026-02-22&page=1&size=10
    @GetMapping("/spaces")
    public ApiResponse<PageResponse<SpaceReservableResponse>> reservableSpaces(
            @RequestParam(name = "buildingId") Integer buildingId,
            @RequestParam(name = "date") LocalDate date,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "spaceId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        return ApiResponse.ok(PageResponse.of(
                spaceReservationService.reservableSpaces(buildingId, date, pageable)
        ));
    }

    // ✅ tenant만 예약 생성
    @PostMapping
    public ApiResponse<SpaceReservationResponse> create(
            @AuthenticationPrincipal AuthUser me,
            @Validated @RequestBody CreateSpaceReservationRequest request
    ) {
        return ApiResponse.ok(spaceReservationService.create(me, request));
    }

    // ✅ 내 예약 조회
    @GetMapping("/me")
    public ApiResponse<PageResponse<SpaceReservationResponse>> myReservations(
            @AuthenticationPrincipal AuthUser me,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "reservationId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        return ApiResponse.ok(PageResponse.of(
                spaceReservationService.myReservations(me, pageable)
        ));
    }

    // ✅ 내 예약 취소
    @PutMapping("/cancel/{reservationId}")
    public ApiResponse<SpaceReservationResponse> cancel(
            @AuthenticationPrincipal AuthUser me,
            @PathVariable("reservationId") Integer reservationId
    ) {
        return ApiResponse.ok(spaceReservationService.cancel(me, reservationId));
    }
}