// 경로: org/myweb/uniplace/domain/reservation/domain/policy/ReservationConflictPolicy.java
package org.myweb.uniplace.domain.reservation.domain.policy;

import java.time.LocalDateTime;

public interface ReservationConflictPolicy {

    void validateRoomConflict(Integer roomId, LocalDateTime startAt, LocalDateTime endAt);

    void validateDuplicateTelTime(String tourTel, LocalDateTime startAt, LocalDateTime endAt);
}