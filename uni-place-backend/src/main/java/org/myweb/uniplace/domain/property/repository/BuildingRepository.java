// 경로: org/myweb/uniplace/domain/property/repository/BuildingRepository.java
package org.myweb.uniplace.domain.property.repository;

import java.util.List;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {

    List<Building> findByBuildingNm(String buildingNm);
}