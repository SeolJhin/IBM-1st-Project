package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;

import java.math.BigDecimal;

/**
 * Product 엔티티
 * MySQL 테이블 컬럼과 완전히 일치
 */
@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prod_id")
    private Integer prodId;

    @Column(name = "prod_nm", nullable = false, length = 50)
    private String prodNm;

    @Column(name = "prod_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal prodPrice;

    @Column(name = "prod_stock", nullable = false)
    private Integer prodStock;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "prod_desc", nullable = false, length = 2000)
    private String prodDesc;

    @Enumerated(EnumType.STRING)
    @Column(name = "prod_st", nullable = false, columnDefinition = "ENUM('on_sale','sold_out') DEFAULT 'on_sale'")
    private ProductStatus prodSt = ProductStatus.ON_SALE;

    @Column(name = "affiliate_id", nullable = false)
    private Integer affiliateId;
}