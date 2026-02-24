package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import java.math.BigDecimal;

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

    @Column(name = "prod_desc", length = 2000)
    private String prodDesc;

    @Enumerated(EnumType.STRING)
    @Column(name = "prod_st", nullable = false)
    private ProductStatus prodSt = ProductStatus.on_sale;   // ✅ Fix: ON_SALE → on_sale

    @Column(name = "affiliate_id")
    private Integer affiliateId;

    /**
     * 재고 차감
     * - 품절 상태면 PRODUCT_SOLD_OUT
     * - 요청 수량이 재고보다 많으면 PRODUCT_OUT_OF_STOCK
     * - 차감 후 재고 0 이면 자동으로 품절 처리
     */
    public void decreaseStock(int quantity) {
        if (this.prodSt == ProductStatus.sold_out) {
            throw new BusinessException(ErrorCode.PRODUCT_SOLD_OUT);
        }
        if (this.prodStock < quantity) {
            throw new BusinessException(ErrorCode.PRODUCT_OUT_OF_STOCK);
        }
        this.prodStock -= quantity;
        if (this.prodStock == 0) {
            this.prodSt = ProductStatus.sold_out;
        }
    }

    /**
     * 주문 취소 시 재고 복원
     */
    public void restoreStock(int quantity) {
        this.prodStock += quantity;
        if (this.prodSt == ProductStatus.sold_out && this.prodStock > 0) {
            this.prodSt = ProductStatus.on_sale;
        }
    }
}
