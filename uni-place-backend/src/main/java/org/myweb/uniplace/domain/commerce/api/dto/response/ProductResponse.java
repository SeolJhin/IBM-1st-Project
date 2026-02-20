package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;

import java.math.BigDecimal;

@Getter
@Builder
public class ProductResponse {

    private Long prodId;
    private String prodName;
    private String prodDesc;
    private BigDecimal price;
    private Integer stock;
    private String category;
    private String imageUrl;

    public static ProductResponse fromEntity(Product product) {
        return ProductResponse.builder()
                .prodId(product.getProdId())
                .prodName(product.getProdName())
                .prodDesc(product.getProdDesc())
                .price(product.getPrice())
                .stock(product.getStock())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .build();
    }
}