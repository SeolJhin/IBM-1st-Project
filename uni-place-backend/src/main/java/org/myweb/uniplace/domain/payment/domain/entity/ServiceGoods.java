package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "service_goods",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_service_goods_cd", columnNames = "service_goods_cd")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ServiceGoods {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_goods_id")
    private Integer serviceGoodsId;

    @Column(name = "service_goods_cd", nullable = false, length = 50)
    private String serviceGoodsCd;

    @Column(name = "service_goods_nm", nullable = false, length = 50)
    private String serviceGoodsNm;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Integer isActive = 1;

    @Column(name = "display_order")
    private Integer displayOrder;
}