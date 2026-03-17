package org.myweb.uniplace.domain.commerce.repository;

import org.myweb.uniplace.domain.commerce.domain.entity.RoomServiceOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomServiceOrderRepository extends JpaRepository<RoomServiceOrder, Integer> {  // ✅ Fix: Long → Integer

    // 내 룸서비스 주문 목록 (취소된 주문 제외)
    @Query("SELECT r FROM RoomServiceOrder r " +
           "JOIN FETCH r.room " +
           "WHERE r.user.userId = :userId " +
           "AND r.orderSt != org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus.cancelled " +
           "ORDER BY r.createdAt DESC")
    List<RoomServiceOrder> findAllByUserIdWithRoom(@Param("userId") String userId);

    // 결제 취소 시 parentOrder ID로 RoomServiceOrder 목록 조회
    @Query("SELECT r FROM RoomServiceOrder r WHERE r.parentOrder.orderId = :orderId")
    List<RoomServiceOrder> findByParentOrderId(@Param("orderId") Integer orderId);

    @Query(value = "SELECT r FROM RoomServiceOrder r " +
                   "JOIN FETCH r.user " +
                   "JOIN FETCH r.room",
           countQuery = "SELECT COUNT(r) FROM RoomServiceOrder r")
    Page<RoomServiceOrder> findAllWithDetails(Pageable pageable);
}