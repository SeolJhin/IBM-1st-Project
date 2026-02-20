// Repository
// 경로: org/myweb/uniplace/domain/commerce/repository/CartRepository.java
package org.myweb.uniplace.domain.commerce.repository;

import java.util.Optional;

import org.myweb.uniplace.domain.commerce.domain.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {

    Optional<Cart> findByUserId(String userId);
}