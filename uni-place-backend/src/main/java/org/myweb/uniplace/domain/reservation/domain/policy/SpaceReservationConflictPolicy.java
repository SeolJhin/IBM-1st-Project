// 경로: org/myweb/uniplace/domain/reservation/domain/policy/SpaceReservationConflictPolicy.java
package org.myweb.uniplace.domain.reservation.domain.policy;

import java.time.LocalDateTime;

public interface SpaceReservationConflictPolicy {

    void validateSpaceConflict(Integer spaceId, LocalDateTime startAt, LocalDateTime endAt);
}