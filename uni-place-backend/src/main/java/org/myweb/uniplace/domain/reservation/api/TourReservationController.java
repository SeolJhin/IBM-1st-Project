// Controller (✅ 슬롯 조회 API 추가)
// 경로: org/myweb/uniplace/domain/reservation/api/TourReservationController.java
package org.myweb.uniplace.domain.reservation.api;

import java.time.LocalDate;

import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.application.RoomService;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;

import org.myweb.uniplace.domain.reservation.api.dto.request.CancelTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.LookupTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservableResponse;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservationResponse;
import org.myweb.uniplace.domain.reservation.application.TourReservationService;

import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/tour-reservations")
public class TourReservationController {

    private final TourReservationService tourReservationService;
    private final RoomService roomService;

    // ✅ 예약용: 선택된 건물에서 available 방만 조회
    @GetMapping("/rooms")
    public ApiResponse<PageResponse<RoomSummaryResponse>> reservableRooms(
            @RequestParam(name = "buildingId", required = false) Integer buildingId,
            @RequestParam(name = "buildingNm", required = false) String buildingNm,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "roomNo") String sort,
            @RequestParam(name = "direct", defaultValue = "ASC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        RoomSearchRequest request = RoomSearchRequest.builder()
                .buildingId(buildingId)
                .buildingNm(buildingNm)
                .roomSt(RoomStatus.available)
                .build();

        return ApiResponse.ok(PageResponse.of(roomService.searchPage(request, pageable)));
    }

    // ✅ (추가) 특정 방 + 날짜 예약가능 슬롯만 조회 -> UI는 여기 availableSlots만 출력하면 됨
    // 예) /tour-reservations/slots?buildingId=1&roomId=3&date=2026-02-22
    @GetMapping("/slots")
    public ApiResponse<TourReservableResponse> reservableSlots(
            @RequestParam(name = "buildingId") Integer buildingId,
            @RequestParam(name = "roomId") Integer roomId,
            @RequestParam(name = "date") LocalDate date
    ) {
        return ApiResponse.ok(tourReservationService.reservableSlots(buildingId, roomId, date));
    }

    @PostMapping
    public ApiResponse<TourReservationResponse> create(
            @Validated @RequestBody CreateTourReservationRequest request
    ) {
        return ApiResponse.ok(tourReservationService.create(request));
    }

    @PostMapping("/lookup")
    public ApiResponse<PageResponse<TourReservationResponse>> lookup(
            @Validated @RequestBody LookupTourReservationRequest request,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "tourId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        return ApiResponse.ok(PageResponse.of(tourReservationService.lookup(request, pageable)));
    }

    @PutMapping("/cancel/{tourId}")
    public ApiResponse<TourReservationResponse> cancel(
            @PathVariable("tourId") Integer tourId,
            @Validated @RequestBody CancelTourReservationRequest request
    ) {
        return ApiResponse.ok(tourReservationService.cancel(tourId, request));
    }
}