// DTO (Request)
// 경로: org/myweb/uniplace/domain/commerce/api/dto/request/CartAddRequest.java
package org.myweb.uniplace.domain.commerce.api.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CartAddRequest {

    @NotNull(message = "prodId는 필수입니다.")
    private Integer prodId;

    @NotNull(message = "orderQuantity는 필수입니다.")
    @Min(value = 1, message = "orderQuantity는 1 이상이어야 합니다.")
    private Integer orderQuantity;

    @NotNull(message = "orderPrice는 필수입니다.")
    private BigDecimal orderPrice;
}