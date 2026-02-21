// 경로: org/myweb/uniplace/domain/reservation/repository/TourReservationRepository.java
package org.myweb.uniplace.domain.reservation.repository;

import java.time.LocalDateTime;
import java.util.Collection;

import org.myweb.uniplace.domain.reservation.domain.entity.TourReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TourReservationRepository extends JpaRepository<TourReservationEntity, Integer> {

    @Query("""
        select count(t) > 0
          from TourReservationEntity t
         where t.room.roomId = :roomId
           and t.tourSt not in :inactive
           and (:startAt < t.tourEndAt and :endAt > t.tourStartAt)
    """)
    boolean existsRoomTimeConflict(
            @Param("roomId") Integer roomId,
            @Param("inactive") Collection<TourStatus> inactive,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    boolean existsByTourTelAndTourStartAtAndTourEndAtAndTourStNotIn(
            String tourTel,
            LocalDateTime tourStartAt,
            LocalDateTime tourEndAt,
            Collection<TourStatus> inactive
    );

    Page<TourReservationEntity> findByTourTelAndTourPwdAndTourStNotIn(
            String tourTel,
            String tourPwd,
            Collection<TourStatus> inactive,
            Pageable pageable
    );

    TourReservationEntity findByTourIdAndTourTelAndTourPwd(Integer tourId, String tourTel, String tourPwd);
}