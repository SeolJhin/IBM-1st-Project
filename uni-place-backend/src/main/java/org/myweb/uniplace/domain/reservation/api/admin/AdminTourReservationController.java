// 경로: org/myweb/uniplace/domain/reservation/api/admin/AdminTourReservationController.java
package org.myweb.uniplace.domain.reservation.api.admin;

import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservationResponse;
import org.myweb.uniplace.domain.reservation.domain.entity.TourReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;
import org.myweb.uniplace.domain.reservation.repository.TourReservationRepository;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/tour-reservations")
public class AdminTourReservationController {

    private final TourReservationRepository tourReservationRepository;

    @GetMapping
    public ApiResponse<PageResponse<TourReservationResponse>> list(
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

        Page<TourReservationEntity> result = tourReservationRepository.findAll(pageable);
        return ApiResponse.ok(PageResponse.of(result.map(TourReservationResponse::fromEntity)));
    }

    @PutMapping("/status/{tourId}")
    public ApiResponse<Void> changeStatus(
            @PathVariable Integer tourId,
            @RequestParam("status") TourStatus status
    ) {
        TourReservationEntity e = tourReservationRepository.findById(tourId)
                .orElseThrow();

        e.setTourSt(status);
        return ApiResponse.ok();
    }
}