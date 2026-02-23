// 경로: org/myweb/uniplace/domain/reservation/domain/policy/SpaceReservationConflictPolicyImpl.java
package org.myweb.uniplace.domain.reservation.domain.policy;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;
import org.myweb.uniplace.domain.reservation.repository.SpaceReservationRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SpaceReservationConflictPolicyImpl implements SpaceReservationConflictPolicy {

    private final SpaceReservationRepository spaceReservationRepository;

    // 예약 불가로 보지 않는 상태(취소/종료)는 inactive로 둠
    private static final List<SpaceReservationStatus> INACTIVE =
            List.of(SpaceReservationStatus.cancelled, SpaceReservationStatus.ended);

    @Override
    public void validateSpaceConflict(Integer spaceId, LocalDateTime startAt, LocalDateTime endAt) {
        boolean exists = spaceReservationRepository.existsSpaceTimeConflict(spaceId, INACTIVE, startAt, endAt);
        if (exists) {
            throw new BusinessException(ErrorCode.SPACE_RESERVATION_TIME_CONFLICT); // SPACE_RESERVATION_TIME_CONFLICT 등 분리 가능
        }
    }
}