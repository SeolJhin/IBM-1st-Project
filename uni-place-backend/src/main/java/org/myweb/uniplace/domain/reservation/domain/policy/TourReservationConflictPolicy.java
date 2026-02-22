// 경로: org/myweb/uniplace/domain/reservation/domain/policy/TourReservationConflictPolicy.java
package org.myweb.uniplace.domain.reservation.domain.policy;

import java.time.LocalDateTime;

public interface TourReservationConflictPolicy {

    void validateRoomConflict(Integer roomId, LocalDateTime startAt, LocalDateTime endAt);

    void validateDuplicateTelTime(String tourTel, LocalDateTime startAt, LocalDateTime endAt);
}