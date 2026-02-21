// org/myweb/uniplace/domain/commerce/repository/CartItemRepository.java
package org.myweb.uniplace.domain.commerce.repository;

import java.util.List;
import java.util.Optional;

import org.myweb.uniplace.domain.commerce.domain.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    List<CartItem> findByCartId(Integer cartId);

    Optional<CartItem> findByCartIdAndProdId(Integer cartId, Integer prodId);

    void deleteByCartId(Integer cartId);
}