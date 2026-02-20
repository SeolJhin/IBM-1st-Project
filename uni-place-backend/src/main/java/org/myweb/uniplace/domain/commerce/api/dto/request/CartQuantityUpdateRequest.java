// CartQuantityUpdateRequest.java
package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartQuantityUpdateRequest {
    private Integer quantity;
}