package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartAddRequest {
    private Integer prodId;
    private Integer buildingId;   // ← 추가: 어느 빌딩에서 담는지
    private Integer quantity;
}