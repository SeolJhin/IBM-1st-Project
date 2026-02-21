// org/myweb/uniplace/domain/commerce/domain/entity/Cart.java
package org.myweb.uniplace.domain.commerce.domain.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "cart")
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id")
    private Integer cartId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @CreationTimestamp
    @Column(name = "cart_created_at", updatable = false)
    private LocalDateTime cartCreatedAt;
}