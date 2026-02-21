// 경로: org/myweb/uniplace/domain/reservation/application/TourReservationService.java
package org.myweb.uniplace.domain.reservation.application;

import org.myweb.uniplace.domain.reservation.api.dto.request.CancelTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.CreateTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.request.LookupTourReservationRequest;
import org.myweb.uniplace.domain.reservation.api.dto.response.TourReservationResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TourReservationService {

    TourReservationResponse create(CreateTourReservationRequest request);

    Page<TourReservationResponse> lookup(LookupTourReservationRequest request, Pageable pageable);

    TourReservationResponse cancel(Integer tourId, CancelTourReservationRequest request);
}