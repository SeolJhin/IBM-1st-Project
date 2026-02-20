package org.myweb.uniplace.domain.roomservice.repository;

import org.myweb.uniplace.domain.roomservice.domain.entity.RoomServiceOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomServiceOrderRepository extends JpaRepository<RoomServiceOrder, Long> {

    @Query("SELECT r FROM RoomServiceOrder r " +
           "JOIN FETCH r.room " +
           "WHERE r.user.userId = :userId " +
           "ORDER BY r.createdAt DESC")
    List<RoomServiceOrder> findAllByUserIdWithRoom(@Param("userId") String userId);

    @Query(value = "SELECT r FROM RoomServiceOrder r " +
                   "JOIN FETCH r.user " +
                   "JOIN FETCH r.room",
           countQuery = "SELECT COUNT(r) FROM RoomServiceOrder r")
    Page<RoomServiceOrder> findAllWithDetails(Pageable pageable);
}
