package org.myweb.uniplace.domain.commerce.repository;

import java.util.List;
import java.util.Optional;

import org.myweb.uniplace.domain.commerce.domain.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    List<CartItem> findByCartId(Integer cartId);

    /** 빌딩까지 포함해서 중복 여부 확인 */
    Optional<CartItem> findByCartIdAndProdIdAndBuildingId(Integer cartId, Integer prodId, Integer buildingId);

    void deleteByCartId(Integer cartId);
}