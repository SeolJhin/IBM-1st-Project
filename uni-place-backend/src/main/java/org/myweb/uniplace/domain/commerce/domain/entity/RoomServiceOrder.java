package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer orderId; // ✅ DTO에서 getOrderId 호출

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_order_id", nullable = false)
    private Order parentOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private Room room;

    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    private RoomServiceOrderStatus orderSt;

    private String roomServiceDesc;

    private LocalDateTime createdAt = LocalDateTime.now(); // ✅ DTO에서 getCreatedAt 호출

    // paymentId는 삭제하고, Payment는 별도 repository 조회
}