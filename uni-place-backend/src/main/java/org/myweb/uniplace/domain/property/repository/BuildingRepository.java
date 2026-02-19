package org.myweb.uniplace.domain.property.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import java.util.Optional;

public interface BuildingRepository extends JpaRepository<Building, Integer> {
    Optional<Building> findByBuildingNm(String buildingNm);
}
