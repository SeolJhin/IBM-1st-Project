// 경로: org/myweb/uniplace/domain/reservation/repository/SpaceReservationRepository.java
package org.myweb.uniplace.domain.reservation.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.myweb.uniplace.domain.reservation.domain.entity.SpaceReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceReservationRepository extends JpaRepository<SpaceReservationEntity, Integer> {

    @Query("""
        select count(s) > 0
          from SpaceReservationEntity s
         where s.space.spaceId = :spaceId
           and s.srSt not in :inactive
           and (:startAt < s.srEndAt and :endAt > s.srStartAt)
    """)
    boolean existsSpaceTimeConflict(
            @Param("spaceId") Integer spaceId,
            @Param("inactive") Collection<SpaceReservationStatus> inactive,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    @Query("""
        select s
          from SpaceReservationEntity s
         where s.space.spaceId = :spaceId
           and s.srSt not in :inactive
           and s.srStartAt < :dayEnd
           and s.srEndAt   > :dayStart
    """)
    List<SpaceReservationEntity> findActiveInDayRange(
            @Param("spaceId") Integer spaceId,
            @Param("inactive") Collection<SpaceReservationStatus> inactive,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd
    );

    Page<SpaceReservationEntity> findByUser_UserIdAndSrStNotIn(
            String userId,
            Collection<SpaceReservationStatus> inactive,
            Pageable pageable
    );

    /* =========================
       ✅ ADMIN SEARCH
       ========================= */

    @Query("""
        select s
          from SpaceReservationEntity s
          join s.building b
          join s.space sp
          join s.user u
         where (:buildingId is null or b.buildingId = :buildingId)
           and (:spaceId is null or sp.spaceId = :spaceId)
           and (:userId is null or :userId = '' or u.userId = :userId)
           and (:dayStart is null or :dayEnd is null or (s.srStartAt < :dayEnd and s.srEndAt > :dayStart))
    """)
    Page<SpaceReservationEntity> adminSearch(
            @Param("buildingId") Integer buildingId,
            @Param("spaceId") Integer spaceId,
            @Param("userId") String userId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd,
            Pageable pageable
    );
}