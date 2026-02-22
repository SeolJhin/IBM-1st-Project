package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.user.domain.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_service_order")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RoomServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;                // ✅ Fix: Long → Integer

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_st", nullable = false, length = 20)
    private RoomServiceOrderStatus orderSt;

    @Column(name = "payment_id")
    private Integer paymentId;              // ✅ Fix: Long → Integer

    @Column(name = "room_service_desc", length = 200)  // ✅ Fix: 1000 → 200 (스키마 기준)
    private String roomServiceDesc;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (orderSt   == null) orderSt   = RoomServiceOrderStatus.requested;
    }

    public void updateStatus(RoomServiceOrderStatus status) {
        this.orderSt = status;
    }

    public void completePayment(Integer paymentId) {    // ✅ Fix: Long → Integer
        this.paymentId = paymentId;
        this.orderSt   = RoomServiceOrderStatus.paid;
    }
}
