package org.myweb.uniplace.domain.commerce.repository;

import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    boolean existsByProdName(String prodName);

    Page<Product> findByProdNameContainingIgnoreCaseAndDeleteYn(String keyword, String deleteYn, Pageable pageable);
}