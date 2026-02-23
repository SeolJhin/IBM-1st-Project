package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_order_id", nullable = false)
    private Order parentOrder;

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

    @Column(name = "room_service_desc", length = 200)
    private String roomServiceDesc;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (orderSt == null) {
            orderSt = RoomServiceOrderStatus.requested;
        }
    }

    public void updateStatus(RoomServiceOrderStatus status) {
        this.orderSt = status;
    }
}
