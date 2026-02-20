package org.myweb.uniplace.domain.commerce.api.dto.response;

import lombok.*;
import java.math.BigDecimal;
import org.myweb.uniplace.domain.commerce.domain.entity.Product.ProductStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Integer prodId;
    private String prodName;
    private BigDecimal price;
    private Integer stock;
    private String category;
    private String prodDesc;
    private ProductStatus status;
    private Integer affiliateId;
}