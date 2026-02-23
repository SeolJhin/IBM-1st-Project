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

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> orderItems = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (orderCreatedAt == null) orderCreatedAt = LocalDateTime.now();
        if (orderSt == null)        orderSt        = OrderStatus.ordered;
    }

    public void cancel() {
        if (this.orderSt != OrderStatus.ordered) {
            throw new BusinessException(ErrorCode.ORDER_CANNOT_CANCEL);
        }
        this.orderSt = OrderStatus.cancelled;
    }

    public void completePayment(Integer paymentId) {
        this.paymentId = paymentId;
        this.orderSt   = OrderStatus.paid;
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
