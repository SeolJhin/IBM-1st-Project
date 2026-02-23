package org.myweb.uniplace.domain.commerce.repository;

import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    // 내 주문 목록 - roomServiceOrders 까지 fetch
    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "LEFT JOIN FETCH o.roomServiceOrders rso " +
           "LEFT JOIN FETCH rso.room " +
           "WHERE o.user.userId = :userId " +
           "ORDER BY o.orderCreatedAt DESC")
    List<Order> findAllByUserIdWithItems(@Param("userId") String userId);

    // 주문 상세 - roomServiceOrders 까지 fetch
    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "LEFT JOIN FETCH o.roomServiceOrders rso " +
           "LEFT JOIN FETCH rso.room " +
           "WHERE o.orderId = :orderId")
    Optional<Order> findByIdWithItems(@Param("orderId") Integer orderId);

    // 관리자 전체 조회
    @Query(value = "SELECT DISTINCT o FROM Order o " +
                   "LEFT JOIN FETCH o.orderItems oi " +
                   "LEFT JOIN FETCH oi.product " +
                   "LEFT JOIN FETCH o.roomServiceOrders rso " +
                   "LEFT JOIN FETCH o.user",
           countQuery = "SELECT COUNT(o) FROM Order o")
    Page<Order> findAllWithItems(Pageable pageable);
}
