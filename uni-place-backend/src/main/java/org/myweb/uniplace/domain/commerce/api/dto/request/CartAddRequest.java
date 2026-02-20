// 경로: org/myweb/uniplace/domain/cart/api/dto/request/CartAddRequest.java
package org.myweb.uniplace.domain.cart.api.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartAddRequest {
    private Integer prodId;
    private Integer quantity; // null이면 1
}