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

    // ── 1단계: orderItems fetch (모든 상태 표시) ──────────────────────────
    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "WHERE o.user.userId = :userId " +
           "ORDER BY o.orderCreatedAt DESC")
    List<Order> findAllByUserIdWithItems(@Param("userId") String userId);

    // ── 2단계: roomServiceOrders fetch (MultipleBagFetchException 방지용 분리)
    // 같은 트랜잭션 안에서 호출 → JPA 1차 캐시에서 자동 병합됨
    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.roomServiceOrders rso " +
           "LEFT JOIN FETCH rso.room " +
           "WHERE o.user.userId = :userId")
    List<Order> findAllByUserIdWithRoomServices(@Param("userId") String userId);

    // ── 1단계: 주문 상세 orderItems fetch ────────────────────────────────────
    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.orderItems oi " +
           "LEFT JOIN FETCH oi.product " +
           "WHERE o.orderId = :orderId")
    Optional<Order> findByIdWithItems(@Param("orderId") Integer orderId);

    // ── 2단계: 주문 상세 roomServiceOrders fetch ─────────────────────────────
    @Query("SELECT o FROM Order o " +
           "LEFT JOIN FETCH o.roomServiceOrders rso " +
           "LEFT JOIN FETCH rso.room " +
           "WHERE o.orderId = :orderId")
    Optional<Order> findByIdWithRoomServices(@Param("orderId") Integer orderId);

    // ── 관리자: 1단계 orderItems fetch (페이징 포함) ──────────────────────────
    @Query(value = "SELECT DISTINCT o FROM Order o " +
                   "LEFT JOIN FETCH o.orderItems oi " +
                   "LEFT JOIN FETCH oi.product " +
                   "LEFT JOIN FETCH o.user",
           countQuery = "SELECT COUNT(o) FROM Order o")
    Page<Order> findAllWithItems(Pageable pageable);

    // ── 관리자: 2단계 roomServiceOrders fetch (ID 목록으로 in절 조회) ─────────
    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.roomServiceOrders rso " +
           "LEFT JOIN FETCH rso.room " +
           "WHERE o.orderId IN :orderIds")
    List<Order> findAllWithRoomServicesByIds(@Param("orderIds") List<Integer> orderIds);
    // ── 결제 ID로 주문 조회 (결제 취소 시 Order 상태 변경용) ─────────────────
    @Query("SELECT o FROM Order o WHERE o.paymentId = :paymentId OR " +
           "(o.paymentId IS NULL AND EXISTS (SELECT p FROM org.myweb.uniplace.domain.payment.domain.entity.Payment p " +
           "WHERE p.paymentId = :paymentId AND p.targetId = o.orderId AND p.targetType = 'order'))")
    List<Order> findByPaymentIdOrTarget(@Param("paymentId") Integer paymentId);
}