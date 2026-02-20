// Repository
// 경로: org/myweb/uniplace/domain/property/repository/SpaceRepository.java
package org.myweb.uniplace.domain.property.repository;

import org.myweb.uniplace.domain.property.domain.entity.CommonSpace;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceRepository extends JpaRepository<CommonSpace, Integer> {

    @Query(
        value = """
            select s
              from CommonSpace s
              join s.building b
             where
                   (:buildingId is null or b.buildingId = :buildingId)
               and (:buildingNm is null or :buildingNm = '' or lower(b.buildingNm) like lower(concat('%', :buildingNm, '%')))
               and (:buildingAddr is null or :buildingAddr = '' or lower(b.buildingAddr) like lower(concat('%', :buildingAddr, '%')))
               and (:minParkingCapacity is null or b.parkingCapacity >= :minParkingCapacity)

               and (:spaceNm is null or :spaceNm = '' or lower(s.spaceNm) like lower(concat('%', :spaceNm, '%')))
               and (:spaceFloor is null or s.spaceFloor = :spaceFloor)

               and (:minSpaceCapacity is null or s.spaceCapacity >= :minSpaceCapacity)
               and (:maxSpaceCapacity is null or s.spaceCapacity <= :maxSpaceCapacity)

               and (:spaceOptions is null or :spaceOptions = '' or lower(s.spaceOptions) like lower(concat('%', :spaceOptions, '%')))
            """,
        countQuery = """
            select count(s)
              from CommonSpace s
              join s.building b
             where
                   (:buildingId is null or b.buildingId = :buildingId)
               and (:buildingNm is null or :buildingNm = '' or lower(b.buildingNm) like lower(concat('%', :buildingNm, '%')))
               and (:buildingAddr is null or :buildingAddr = '' or lower(b.buildingAddr) like lower(concat('%', :buildingAddr, '%')))
               and (:minParkingCapacity is null or b.parkingCapacity >= :minParkingCapacity)

               and (:spaceNm is null or :spaceNm = '' or lower(s.spaceNm) like lower(concat('%', :spaceNm, '%')))
               and (:spaceFloor is null or s.spaceFloor = :spaceFloor)

               and (:minSpaceCapacity is null or s.spaceCapacity >= :minSpaceCapacity)
               and (:maxSpaceCapacity is null or s.spaceCapacity <= :maxSpaceCapacity)

               and (:spaceOptions is null or :spaceOptions = '' or lower(s.spaceOptions) like lower(concat('%', :spaceOptions, '%')))
            """
    )
    Page<CommonSpace> searchWithFilters(
            @Param("buildingId") Integer buildingId,
            @Param("buildingNm") String buildingNm,
            @Param("buildingAddr") String buildingAddr,
            @Param("minParkingCapacity") Integer minParkingCapacity,

            @Param("spaceNm") String spaceNm,
            @Param("spaceFloor") Integer spaceFloor,

            @Param("minSpaceCapacity") Integer minSpaceCapacity,
            @Param("maxSpaceCapacity") Integer maxSpaceCapacity,

            @Param("spaceOptions") String spaceOptions,

            Pageable pageable
    );
}