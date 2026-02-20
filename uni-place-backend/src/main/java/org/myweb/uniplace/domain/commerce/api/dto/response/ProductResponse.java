package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;

import java.math.BigDecimal;

/**
 * 상품 응답 DTO
 */
@Getter
public class ProductResponse {

    private Integer prodId;
    private String prodNm;
    private BigDecimal prodPrice;
    private Integer prodStock;
    private String code;
    private String prodDesc;
    private ProductStatus prodSt;
    private Integer affiliateId;

    public ProductResponse(Product product) {
        this.prodId = product.getProdId();
        this.prodNm = product.getProdNm();
        this.prodPrice = product.getProdPrice();
        this.prodStock = product.getProdStock();
        this.code = product.getCode();
        this.prodDesc = product.getProdDesc();
        this.prodSt = product.getProdSt();
        this.affiliateId = product.getAffiliateId();
    }
}