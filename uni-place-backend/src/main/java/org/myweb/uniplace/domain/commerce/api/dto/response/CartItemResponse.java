// CartItemResponse.java
package org.myweb.uniplace.domain.commerce.api.dto.response;

import java.math.BigDecimal;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {

    private Integer cartItemId;
    private Integer prodId;
    private String prodNm;

    private BigDecimal orderPrice;
    private Integer orderQuantity;
    private BigDecimal lineTotal;

    private String thumbnailPath;
}