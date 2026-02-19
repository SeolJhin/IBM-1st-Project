package org.myweb.uniplace.domain.property.repository;

import java.util.Optional;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.enums.BuildingStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {

    Optional<Building> findByBuildingNm(String buildingNm);

    @Query("""
        select b
          from Building b
         where
               (:buildingId is null or b.buildingId = :buildingId)
           and (:buildingNm is null or :buildingNm = '' or lower(b.buildingNm) like lower(concat('%', :buildingNm, '%')))
           and (:buildingAddr is null or :buildingAddr = '' or lower(b.buildingAddr) like lower(concat('%', :buildingAddr, '%')))
           and (:minParkingCapacity is null or b.parkingCapacity >= :minParkingCapacity)
           and (:buildingStatus is null or b.buildingStatus = :buildingStatus)
    """)
    Page<Building> searchWithFilters(
            @Param("buildingId") Long buildingId,
            @Param("buildingNm") String buildingNm,
            @Param("buildingAddr") String buildingAddr,
            @Param("minParkingCapacity") Integer minParkingCapacity,
            @Param("buildingStatus") BuildingStatus buildingStatus,
            Pageable pageable
    );
}
