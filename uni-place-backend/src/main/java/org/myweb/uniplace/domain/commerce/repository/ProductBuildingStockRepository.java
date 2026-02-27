package org.myweb.uniplace.domain.commerce.repository;

import jakarta.persistence.LockModeType;
import org.myweb.uniplace.domain.commerce.domain.entity.ProductBuildingStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductBuildingStockRepository extends JpaRepository<ProductBuildingStock, Integer> {

    List<ProductBuildingStock> findByProdId(Integer prodId);

    Optional<ProductBuildingStock> findByProdIdAndBuildingId(Integer prodId, Integer buildingId);

    /** 재고 차감 시 비관적 락 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ProductBuildingStock s WHERE s.prodId = :prodId AND s.buildingId = :buildingId")
    Optional<ProductBuildingStock> findByProdIdAndBuildingIdWithLock(
            @Param("prodId") Integer prodId,
            @Param("buildingId") Integer buildingId
    );
}