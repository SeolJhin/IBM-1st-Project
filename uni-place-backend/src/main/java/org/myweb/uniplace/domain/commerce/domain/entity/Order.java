package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    // ✅ List → Set 으로 변경 (MultipleBagFetchException 해결)
    @Builder.Default
    @OneToMany(mappedBy = "parentOrder", cascade = CascadeType.ALL)
    private Set<RoomServiceOrder> roomServiceOrders = new HashSet<>();

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