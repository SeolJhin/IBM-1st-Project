package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.myweb.uniplace.global.common.SoftDeleteEntity;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product")
public class Product extends SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prod_id")
    private Integer prodId;

    @NotNull
    @Column(name = "prod_nm", nullable = false, length = 50)
    private String prodName;

    @NotNull
    @Column(name = "prod_price", nullable = false)
    private BigDecimal price;

    @NotNull
    @Column(name = "prod_stock", nullable = false)
    private Integer stock;

    @NotNull
    @Column(name = "code", nullable = false, length = 20)
    private String category;

    @Column(name = "prod_desc", length = 2000)
    private String prodDesc;

    @NotNull
    @Column(name = "prod_st", nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.on_sale;

    @Column(name = "affiliate_id")
    private Integer affiliateId;

    public enum ProductStatus {
        on_sale,
        sold_out
    }

    /** 상품 수정 메서드 */
    public void update(String prodName, BigDecimal price, Integer stock, String category, String prodDesc, ProductStatus status, Integer affiliateId) {
        this.prodName = prodName;
        this.price = price;
        this.stock = stock;
        this.category = category;
        this.prodDesc = prodDesc;
        this.status = status;
        this.affiliateId = affiliateId;
    }
}