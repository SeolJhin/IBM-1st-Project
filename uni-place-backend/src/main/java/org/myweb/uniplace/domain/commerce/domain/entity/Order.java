package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_st", nullable = false, length = 20)
    private OrderStatus orderSt;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal totalPrice;

    @Column(name = "payment_id")
    private Integer paymentId;

    @Column(name = "order_created_at", updatable = false)
    private LocalDateTime orderCreatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "parentOrder", cascade = CascadeType.ALL)
    private List<RoomServiceOrder> roomServiceOrders = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (orderCreatedAt == null) {
            orderCreatedAt = LocalDateTime.now();
        }
        if (orderSt == null) {
            orderSt = OrderStatus.ordered;
        }
        if (totalPrice == null) {
            totalPrice = BigDecimal.ZERO;
        }
    }

    public void cancel() {
        if (this.orderSt != OrderStatus.ordered) {
            throw new BusinessException(ErrorCode.ORDER_CANNOT_CANCEL);
        }
        this.orderSt = OrderStatus.cancelled;
    }

    public void completePayment(Integer paymentId) {
        this.paymentId = paymentId;
        this.orderSt = OrderStatus.paid;
    }

    public void markRefunded(Integer paymentId) {
        if (paymentId != null) {
            this.paymentId = paymentId;
        }
        this.orderSt = OrderStatus.cancelled;
    }

    public void updateTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }
}