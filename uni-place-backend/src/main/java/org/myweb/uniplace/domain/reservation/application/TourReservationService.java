// Service
// 경로: org/myweb/uniplace/domain/reservation/application/TourReservationService.java
package org.myweb.uniplace.domain.reservation.application;

import java.time.LocalDate;

import org.myweb.uniplace.domain.reservation.api.dto.request.CancelTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.LookupTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservableResponse;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservationResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TourReservationService {

    TourReservationResponse create(CreateTourReservationRequest request);

    Page<TourReservationResponse> lookup(LookupTourReservationRequest request, Pageable pageable);

    TourReservationResponse cancel(Integer tourId, CancelTourReservationRequest request);

    // ✅ (추가) 특정 방 + 특정 날짜 예약 가능 슬롯
    TourReservableResponse reservableSlots(Integer buildingId, Integer roomId, LocalDate date);
}