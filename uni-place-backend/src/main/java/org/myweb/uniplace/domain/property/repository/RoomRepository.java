// 경로: org/myweb/uniplace/domain/property/repository/RoomRepository.java
package org.myweb.uniplace.domain.property.repository;

import java.math.BigDecimal;
import java.util.List;

import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.domain.enums.PetAllowedYn;
import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.RoomType;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {

    // ──────────────────────────────────────────────────────────────────────
    //  기존: 검색 필터 페이징 조회
    // ──────────────────────────────────────────────────────────────────────
    @Query("""
        select r
          from Room r
         where r.deleteYn = 'N'
           and r.building.deleteYn = 'N'
           and (:buildingId is null or r.building.buildingId = :buildingId)
           and (:buildingNm is null or :buildingNm = '' or lower(r.building.buildingNm) like lower(concat('%', :buildingNm, '%')))
           and (:buildingAddr is null or :buildingAddr = '' or lower(r.building.buildingAddr) like lower(concat('%', :buildingAddr, '%')))
           and (:minParkingCapacity is null or r.building.parkingCapacity >= :minParkingCapacity)

           and (:roomNo is null or r.roomNo = :roomNo)
           and (:floor is null or r.floor = :floor)

           and (:minRoomSize is null or r.roomSize >= :minRoomSize)
           and (:maxRoomSize is null or r.roomSize <= :maxRoomSize)

           and (:roomType is null or r.roomType = :roomType)
           and (:petAllowedYn is null or r.petAllowedYn = :petAllowedYn)
           
           and (:minDeposit is null or r.deposit is null or r.deposit >= :minDeposit)
           and (:maxDeposit is null or r.deposit is null or r.deposit <= :maxDeposit)

           and (:minRentPrice is null or r.rentPrice >= :minRentPrice)
           and (:maxRentPrice is null or r.rentPrice <= :maxRentPrice)

           and (:minManageFee is null or r.manageFee is null or r.manageFee >= :minManageFee)
           and (:maxManageFee is null or r.manageFee is null or r.manageFee <= :maxManageFee)

           and (:rentType is null or r.rentType = :rentType)
           and (:roomSt is null or r.roomSt = :roomSt)
           and (:sunDirection is null or r.sunDirection = :sunDirection)

           and (:minRoomCapacity is null or r.roomCapacity >= :minRoomCapacity)
           and (:maxRoomCapacity is null or r.roomCapacity <= :maxRoomCapacity)

           and (:minRentMin is null or r.rentMin >= :minRentMin)
           and (:maxRentMin is null or r.rentMin <= :maxRentMin)

           and (:roomOptions is null or :roomOptions = '' or lower(r.roomOptions) like lower(concat('%', :roomOptions, '%')))
    """)
    Page<Room> searchWithFilters(
            @Param("buildingId") Integer buildingId,
            @Param("buildingNm") String buildingNm,
            @Param("buildingAddr") String buildingAddr,
            @Param("minParkingCapacity") Integer minParkingCapacity,

            @Param("roomNo") Integer roomNo,
            @Param("floor") Integer floor,

            @Param("minRoomSize") BigDecimal minRoomSize,
            @Param("maxRoomSize") BigDecimal maxRoomSize,

            @Param("roomType") RoomType roomType,
            @Param("petAllowedYn") PetAllowedYn petAllowedYn,

            @Param("minDeposit") BigDecimal minDeposit,
            @Param("maxDeposit") BigDecimal maxDeposit,

            @Param("minRentPrice") BigDecimal minRentPrice,
            @Param("maxRentPrice") BigDecimal maxRentPrice,

            @Param("minManageFee") BigDecimal minManageFee,
            @Param("maxManageFee") BigDecimal maxManageFee,

            @Param("rentType") RentType rentType,
            @Param("roomSt") RoomStatus roomSt,
            @Param("sunDirection") SunDirection sunDirection,

            @Param("minRoomCapacity") Integer minRoomCapacity,
            @Param("maxRoomCapacity") Integer maxRoomCapacity,

            @Param("minRentMin") Integer minRentMin,
            @Param("maxRentMin") Integer maxRentMin,

            @Param("roomOptions") String roomOptions,

            Pageable pageable
    );

    // ──────────────────────────────────────────────────────────────────────
    //  ✅ 신규: AI 추천용 — 리뷰 평점·계약 수 기반 후보 방 최대 10개 조회
    //
    //  점수 가중치:
    //    평균 평점    × 0.5
    //    리뷰 수      × 0.3
    //    계약 수      × 0.2
    //
    //  조건:
    //    - delete_yn = 'N'
    //    - room_st   = 'available'
    //    - 리뷰 or 계약이 1건 이상 있는 방만 포함
    // ──────────────────────────────────────────────────────────────────────
    @Query(
        nativeQuery = true,
        value = """
            SELECT
                r.room_id                          AS roomId,
                COALESCE(AVG(rv.rating), 0)        AS avgRating,
                COUNT(DISTINCT rv.review_id)       AS reviewCount,
                COUNT(DISTINCT c.contract_id)      AS contractCount
            FROM rooms r
            LEFT JOIN reviews  rv ON rv.room_id  = r.room_id
            LEFT JOIN contract c  ON c.room_id   = r.room_id
                                 AND c.contract_st IN ('active', 'ended')
            WHERE r.delete_yn = 'N'
              AND r.room_st   = 'available'
            GROUP BY r.room_id
            HAVING (COUNT(DISTINCT rv.review_id) + COUNT(DISTINCT c.contract_id)) > 0
            ORDER BY
                (COALESCE(AVG(rv.rating), 0) * 0.5
                 + COUNT(DISTINCT rv.review_id) * 0.3
                 + COUNT(DISTINCT c.contract_id) * 0.2) DESC
            LIMIT 10
        """
    )
    List<RoomStatProjection> findTopCandidateRooms();
}
