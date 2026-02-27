package org.myweb.uniplace.domain.commerce.domain.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "cart_items",
    uniqueConstraints = {
        // 빌딩이 다르면 같은 상품도 별개 아이템
        @UniqueConstraint(name = "uq_cart_item", columnNames = {"cart_id", "prod_id", "building_id"})
    }
)
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_item_id")
    private Integer cartItemId;

    @Column(name = "cart_id", nullable = false)
    private Integer cartId;

    @Column(name = "prod_id", nullable = false)
    private Integer prodId;

    /** 어느 빌딩에서 담은 상품인지 */
    @Column(name = "building_id")
    private Integer buildingId;

    @Column(name = "order_quantity", nullable = false)
    private Integer orderQuantity;

    @Column(name = "order_price", nullable = false, precision = 10, scale = 0)
    private BigDecimal orderPrice;

    public void increase(int qty) {
        this.orderQuantity += qty;
    }

    public void changeQuantity(int qty) {
        this.orderQuantity = Math.max(qty, 1);
    }
}