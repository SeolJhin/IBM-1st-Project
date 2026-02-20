package org.myweb.uniplace.domain.commerce.repository;

import org.myweb.uniplace.domain.commerce.domain.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
