package org.myweb.uniplace.domain.commerce.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class OrderCreateRequest {

    @NotNull(message = "buildingId는 필수입니다.")
    private Integer buildingId;   // 빌딩별 재고 차감 + order_items에 저장

    private List<OrderItemDto> items;

    @Getter
    public static class OrderItemDto {
        private Integer prodId;
        private Integer orderQuantity;
    }
}