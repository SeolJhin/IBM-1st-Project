// 경로: org/myweb/uniplace/domain/reservation/domain/policy/TourReservationConflictPolicyImpl.java
package org.myweb.uniplace.domain.reservation.domain.policy;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;
import org.myweb.uniplace.domain.reservation.repository.TourReservationRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class TourReservationConflictPolicyImpl implements TourReservationConflictPolicy {

    private final TourReservationRepository tourReservationRepository;

    private static final List<TourStatus> INACTIVE = List.of(TourStatus.cancelled, TourStatus.ended);

    @Override
    public void validateRoomConflict(Integer roomId, LocalDateTime startAt, LocalDateTime endAt) {
        boolean exists = tourReservationRepository.existsRoomTimeConflict(roomId, INACTIVE, startAt, endAt);
        if (exists) {
            throw new BusinessException(ErrorCode.BAD_REQUEST); // TOUR_RESERVATION_TIME_CONFLICT 등으로 분리 가능
        }
    }

    @Override
    public void validateDuplicateTelTime(String tourTel, LocalDateTime startAt, LocalDateTime endAt) {
        boolean exists = tourReservationRepository.existsByTourTelAndTourStartAtAndTourEndAtAndTourStNotIn(
                tourTel, startAt, endAt, INACTIVE
        );
        if (exists) {
            throw new BusinessException(ErrorCode.BAD_REQUEST); // TOUR_RESERVATION_DUPLICATE 등으로 분리 가능
        }
    }
}