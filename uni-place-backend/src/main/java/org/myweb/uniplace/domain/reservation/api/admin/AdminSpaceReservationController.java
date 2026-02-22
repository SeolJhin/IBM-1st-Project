// 경로: org/myweb/uniplace/domain/reservation/api/admin/AdminSpaceReservationController.java
package org.myweb.uniplace.domain.reservation.api.admin;

import java.time.LocalDate;

import org.myweb.uniplace.domain.reservation.api.dto.request.CancelSpaceReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.SpaceReservationResponse;
import org.myweb.uniplace.domain.reservation.application.SpaceReservationService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/space-reservations")
public class AdminSpaceReservationController {

    private final SpaceReservationService spaceReservationService;

    // ✅ 어드민 예약 목록 조회(필터 + 페이징)
    // 예) /admin/space-reservations?buildingId=1&spaceId=2&date=2026-02-22&page=1&size=10
    @GetMapping
    public ApiResponse<PageResponse<SpaceReservationResponse>> search(
            @AuthenticationPrincipal AuthUser me,
            @RequestParam(name = "buildingId", required = false) Integer buildingId,
            @RequestParam(name = "spaceId", required = false) Integer spaceId,
            @RequestParam(name = "userId", required = false) String userId,
            @RequestParam(name = "date", required = false) LocalDate date,
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
                spaceReservationService.adminSearch(me, buildingId, spaceId, userId, date, pageable)
        ));
    }

    // ✅ 어드민 예약 상세
    @GetMapping("/{reservationId}")
    public ApiResponse<SpaceReservationResponse> detail(
            @AuthenticationPrincipal AuthUser me,
            @PathVariable Integer reservationId
    ) {
        return ApiResponse.ok(spaceReservationService.adminDetail(me, reservationId));
    }

    // ✅ 어드민 예약 확정
    @PutMapping("/{reservationId}/confirm")
    public ApiResponse<SpaceReservationResponse> confirm(
            @AuthenticationPrincipal AuthUser me,
            @PathVariable Integer reservationId
    ) {
        return ApiResponse.ok(spaceReservationService.adminConfirm(me, reservationId));
    }

    // ✅ 어드민 예약 종료 처리(운영상 강제 종료)
    @PutMapping("/{reservationId}/end")
    public ApiResponse<SpaceReservationResponse> end(
            @AuthenticationPrincipal AuthUser me,
            @PathVariable Integer reservationId
    ) {
        return ApiResponse.ok(spaceReservationService.adminEnd(me, reservationId));
    }

    // ✅ 어드민 예약 취소
    @PutMapping("/{reservationId}/cancel")
    public ApiResponse<SpaceReservationResponse> cancel(
            @AuthenticationPrincipal AuthUser me,
            @PathVariable Integer reservationId,
            @Validated @RequestBody(required = false) CancelSpaceReservationRequest request
    ) {
        return ApiResponse.ok(spaceReservationService.adminCancel(me, reservationId, request));
    }
}