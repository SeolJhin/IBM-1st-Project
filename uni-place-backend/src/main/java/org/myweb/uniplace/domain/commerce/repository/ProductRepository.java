package org.myweb.uniplace.domain.commerce.repository;

import java.util.List;
import java.util.Optional;

import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Product JPA Repository
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

	Optional<Product> findByProdIdIn(List<Integer> prodIds);
}