// CartAddRequest.java
package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartAddRequest {
    private Integer prodId;
    private Integer quantity;
}