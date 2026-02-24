package org.myweb.uniplace.domain.commerce.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Product JPA Repository
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

	List<Product> findByProdIdIn(List<Integer> prodIds);

	/**
	 * 재고 차감용 비관적 락 조회 (SELECT ... FOR UPDATE)
	 * 동시 주문으로 인한 재고 초과 차감 방지
	 */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT p FROM Product p WHERE p.prodId = :prodId")
	Optional<Product> findByIdWithLock(@Param("prodId") Integer prodId);
}
