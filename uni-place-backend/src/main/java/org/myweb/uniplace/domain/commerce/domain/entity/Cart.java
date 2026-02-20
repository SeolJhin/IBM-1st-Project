// Entity (Cart)
// 경로: org/myweb/uniplace/domain/commerce/domain/entity/Cart.java
package org.myweb.uniplace.domain.commerce.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "cart")
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id", nullable = false)
    private Integer cartId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "cart_created_at", nullable = false)
    private LocalDateTime cartCreatedAt;

    @PrePersist
    private void prePersist() {
        if (this.cartCreatedAt == null) {
            this.cartCreatedAt = LocalDateTime.now();
        }
    }
}