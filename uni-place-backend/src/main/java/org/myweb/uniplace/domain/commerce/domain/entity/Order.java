package org.myweb.uniplace.domain.commerce.domain.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.user.domain.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @Enumerated(EnumType.STRING)
    private OrderStatus orderSt;

    private BigDecimal totalPrice;

    private LocalDateTime orderCreatedAt = LocalDateTime.now(); // ✅ 추가

    @OneToMany(mappedBy = "parentOrder", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems = new ArrayList<>(); // ✅ 추가

    @OneToMany(mappedBy = "parentOrder", cascade = CascadeType.ALL)
    private List<RoomServiceOrder> roomServiceOrders = new ArrayList<>();

    public void cancel() { // ✅ cancel 메서드 추가
        this.orderSt = OrderStatus.cancelled;
    }

    public void updateTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }
}