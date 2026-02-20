package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductCreateRequest {

    @NotNull
    private String prodName;

    @NotNull
    private BigDecimal price;

    @NotNull
    private Integer stock;

    @NotNull
    private String category;

    private String prodDesc;

    private Integer affiliateId;
}