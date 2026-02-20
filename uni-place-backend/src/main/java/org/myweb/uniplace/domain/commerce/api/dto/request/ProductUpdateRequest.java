package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import org.myweb.uniplace.domain.commerce.domain.entity.Product.ProductStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductUpdateRequest {

    @NotNull
    private String prodName;

    @NotNull
    private BigDecimal price;

    @NotNull
    private Integer stock;

    @NotNull
    private String category;

    private String prodDesc;

    @NotNull
    private ProductStatus status;

    private Integer affiliateId;
}