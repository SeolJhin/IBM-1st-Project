// 경로: org/myweb/uniplace/domain/property/repository/BuildingRepository.java
package org.myweb.uniplace.domain.property.repository;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {

    boolean existsByBuildingNm(String buildingNm);

    @Query("""
        select b
        from Building b
        where (:keyword is null or :keyword = ''
               or lower(b.buildingNm) like lower(concat('%', :keyword, '%'))
               or lower(b.buildingAddr) like lower(concat('%', :keyword, '%')))
    """)
    Page<Building> search(@Param("keyword") String keyword, Pageable pageable);
}
