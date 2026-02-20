package org.myweb.uniplace.domain.commerce.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class ProductCreateRequest {

    @NotBlank
    @Size(max = 100)
    private String prodName;

    @Size(max = 500)
    private String prodDesc;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal price;

    @NotNull
    @Min(0)
    private Integer stock;

    @Size(max = 50)
    private String category;

    @Size(max = 500)
    private String imageUrl;
}