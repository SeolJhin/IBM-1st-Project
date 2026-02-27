package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.entity.ProductBuildingStock;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 상품 + 빌딩별 재고 통합 응답 DTO
 * - 프론트에서 빌딩 선택 시 해당 빌딩 재고를 바로 보여주기 위해 사용
 */
@Getter
public class ProductWithBuildingStockResponse {

    private Integer         prodId;
    private String          prodNm;
    private BigDecimal      prodPrice;
    private String          code;
    private String          prodDesc;
    private ProductStatus   prodSt;
    private Integer         affiliateId;

    /** 빌딩ID → 재고 수량 맵 */
    private Map<Integer, Integer> buildingStocks;

    public ProductWithBuildingStockResponse(Product product, List<ProductBuildingStock> stocks) {
        this.prodId    = product.getProdId();
        this.prodNm    = product.getProdNm();
        this.prodPrice = product.getProdPrice();
        this.code      = product.getCode();
        this.prodDesc  = product.getProdDesc();
        this.prodSt    = product.getProdSt();
        this.affiliateId = product.getAffiliateId();
        this.buildingStocks = stocks.stream()
            .collect(Collectors.toMap(
                ProductBuildingStock::getBuildingId,
                ProductBuildingStock::getStock
            ));
    }
}