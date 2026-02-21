// 경로: org/myweb/uniplace/domain/reservation/domain/policy/ReservationValidator.java
package org.myweb.uniplace.domain.reservation.domain.policy;

import java.time.Duration;
import java.time.LocalDateTime;

import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class ReservationValidator {

    private static final long MIN_TOUR_MINUTES = 30;

    public void validateTourTime(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null || endAt == null || !endAt.isAfter(startAt)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);//TOUR_RESERVATION_DATE_INVALID
        }

        long minutes = Duration.between(startAt, endAt).toMinutes();
        if (minutes < MIN_TOUR_MINUTES) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);//TOUR_RESERVATION_TOO_SHORT
        }
    }
}