// 경로: org/myweb/uniplace/domain/reservation/api/TourReservationController.java
package org.myweb.uniplace.domain.reservation.api;

import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.application.RoomService;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.reservation.api.dto.request.CancelTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.LookupTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservationResponse;
import org.myweb.uniplace.domain.reservation.application.TourReservationService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.*;
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
            @RequestParam(name = "sort", defaultValue = "roomId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
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

    @PostMapping
    public ApiResponse<TourReservationResponse> create(
            @Validated @RequestBody CreateTourReservationRequest request
    ) {
        return ApiResponse.ok(tourReservationService.create(request));
    }

    @PostMapping("/lookup") //예약조회 비번때문에 post로 해야함
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
            @PathVariable Integer tourId,
            @Validated @RequestBody CancelTourReservationRequest request
    ) {
        return ApiResponse.ok(tourReservationService.cancel(tourId, request));
    }
}