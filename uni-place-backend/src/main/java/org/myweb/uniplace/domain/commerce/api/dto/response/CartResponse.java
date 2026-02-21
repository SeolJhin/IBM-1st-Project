// CartResponse.java
package org.myweb.uniplace.domain.commerce.api.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartResponse {

    private Integer cartId;
    private String userId;

    private List<CartItemResponse> items;

    private BigDecimal totalAmount;
    private Integer totalQuantity;
}