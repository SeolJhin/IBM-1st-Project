package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_no")
    private Long orderItemNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_no", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prod_id", nullable = false)
    private Product product;

    @Column(name = "order_quantity", nullable = false)
    private Integer orderQuantity;

    @Column(name = "order_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal orderPrice;

    public static OrderItem of(Order order, Product product, int quantity) {
        return OrderItem.builder()
                .order(order)
                .product(product)
                .orderQuantity(quantity)
                .orderPrice(product.getProdPrice().multiply(BigDecimal.valueOf(quantity)))
                .build();
    }
}
