package org.myweb.uniplace.domain.commerce.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * 상품 생성 요청 DTO
 */
@Getter
public class ProductCreateRequest {

    @NotBlank
    private String prodNm;

    @NotNull
    private BigDecimal prodPrice;

    @NotNull
    private Integer prodStock;

    @NotBlank
    private String code;

    @NotBlank
    private String prodDesc;

    private Integer affiliateId;
}