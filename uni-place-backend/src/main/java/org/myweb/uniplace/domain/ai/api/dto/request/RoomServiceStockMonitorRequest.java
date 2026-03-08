package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class RoomServiceStockMonitorRequest {

    private Integer buildingId;
    private Integer prodId;
    private String prodNm;
    private Integer prodStock;
    private Integer affiliateId;

    public AiIntent getIntent() {
        return AiIntent.ROOMSERVICE_STOCK_MONITOR;
    }
}
