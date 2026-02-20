package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.Getter;

import java.util.List;

@Getter
public class OrderCreateRequest {

    private List<OrderItemDto> items;

    @Getter
    public static class OrderItemDto {
        private Integer prodId;
        private Integer orderQuantity;
    }
}
