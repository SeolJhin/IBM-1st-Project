// 경로: org/myweb/uniplace/domain/reservation/domain/policy/ReservationValidator.java
package org.myweb.uniplace.domain.reservation.domain.policy;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.myweb.uniplace.domain.reservation.domain.enums.TourFixedSlot;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceFixedSlot;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class ReservationValidator {

    private static final long MIN_TOUR_MINUTES = 30;

    /* =========================
       1️⃣ 방 예약 (Tour)
       ========================= */

    // 기본 시간 검증
    public void validateTourTime(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null || endAt == null || !endAt.isAfter(startAt)) {
            throw new BusinessException(ErrorCode.TOUR_RESERVATION_INVALID_TIME);
        }

        long minutes = Duration.between(startAt, endAt).toMinutes();
        if (minutes < MIN_TOUR_MINUTES) {
            throw new BusinessException(ErrorCode.TOUR_RESERVATION_INVALID_TIME);
        }
    }

    // 고정 슬롯 검증
    public void validateTourFixedSlot(LocalDateTime startAt, LocalDateTime endAt) {
        LocalTime s = startAt.toLocalTime();
        LocalTime e = endAt.toLocalTime();

        if (!TourFixedSlot.matches(s, e)) {
            throw new BusinessException(ErrorCode.TOUR_RESERVATION_INVALID_SLOT);
        }
    }

    /* =========================
       2️⃣ 공용공간 예약 (Space)
       ========================= */

    // 같은 날짜 + start < end 검증
    public void validateSpaceTime(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null || endAt == null || !endAt.isAfter(startAt)) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_INVALID_TIME);
        }

        if (!startAt.toLocalDate().equals(endAt.toLocalDate())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
    }

    // 고정 슬롯 검증
    public void validateSpaceFixedSlot(LocalDateTime startAt, LocalDateTime endAt) {
        LocalTime s = startAt.toLocalTime();
        LocalTime e = endAt.toLocalTime();

        if (!SpaceFixedSlot.matches(s, e)) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_INVALID_SLOT);
        }
    }
}