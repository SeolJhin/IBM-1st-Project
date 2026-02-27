package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.ProductBuildingStock;

@Getter
public class ProductBuildingStockResponse {
    private final Integer stockId;
    private final Integer prodId;
    private final Integer buildingId;
    private final Integer stock;

    public ProductBuildingStockResponse(ProductBuildingStock entity) {
        this.stockId    = entity.getStockId();
        this.prodId     = entity.getProdId();
        this.buildingId = entity.getBuildingId();
        this.stock      = entity.getStock();
    }
}