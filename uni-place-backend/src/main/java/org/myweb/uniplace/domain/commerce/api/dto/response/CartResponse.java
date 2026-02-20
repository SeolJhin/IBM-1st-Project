// DTO (Response)
// 경로: org/myweb/uniplace/domain/commerce/api/dto/response/CartResponse.java
package org.myweb.uniplace.domain.commerce.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartResponse {

    private Integer cartId;
    private String userId;
    private LocalDateTime cartCreatedAt;

    private List<CartItemResponse> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartItemResponse {
        private Integer cartItemId;
        private Integer prodId;
        private Integer orderQuantity;
        private BigDecimal orderPrice;
    }
}