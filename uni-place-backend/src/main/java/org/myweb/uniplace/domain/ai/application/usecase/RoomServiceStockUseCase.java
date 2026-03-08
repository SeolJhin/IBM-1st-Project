package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductWithBuildingStockResponse;
import org.myweb.uniplace.domain.commerce.application.ProductService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RoomServiceStockUseCase extends AbstractForwardUseCase {

    private final ProductService productService;

    public RoomServiceStockUseCase(AiGateway aiGateway, ProductService productService) {
        super(aiGateway);
        this.productService = productService;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        slots.put("items", fetchStockItems(slots));

        AiGatewayRequest enrichedRequest = AiGatewayRequest.builder()
            .intent(request.getIntent())
            .userId(request.getUserId())
            .userSegment(request.getUserSegment())
            .prompt(request.getPrompt())
            .slots(slots)
            .build();

        return super.execute(enrichedRequest);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.ROOMSERVICE_STOCK_MONITOR;
    }

    private List<Map<String, Object>> fetchStockItems(Map<String, Object> slots) {
        Integer buildingId = intSlot(slots, "buildingId", "building_id");
        Integer prodId = intSlot(slots, "prodId", "prod_id");
        String prodNm = stringSlot(slots, "prodNm", "prod_nm");
        String loweredProdNm = prodNm == null ? null : prodNm.toLowerCase();

        List<Map<String, Object>> items = new ArrayList<>();
        List<ProductWithBuildingStockResponse> products = productService.getAllOnSaleProductsWithBuildingStocks();
        for (ProductWithBuildingStockResponse product : products) {
            if (prodId != null && !prodId.equals(product.getProdId())) {
                continue;
            }
            if (loweredProdNm != null) {
                String currentName = product.getProdNm() == null ? "" : product.getProdNm().toLowerCase();
                if (!currentName.contains(loweredProdNm)) {
                    continue;
                }
            }

            Map<Integer, Integer> stockMap = product.getBuildingStocks();
            if (stockMap == null || stockMap.isEmpty()) {
                continue;
            }

            if (buildingId != null) {
                Integer stock = stockMap.get(buildingId);
                if (stock != null) {
                    items.add(toItem(buildingId, product, stock));
                }
                continue;
            }

            for (Map.Entry<Integer, Integer> entry : stockMap.entrySet()) {
                items.add(toItem(entry.getKey(), product, entry.getValue()));
            }
        }
        return items;
    }

    private Map<String, Object> toItem(Integer buildingId, ProductWithBuildingStockResponse product, Integer stock) {
        Map<String, Object> item = new HashMap<>();
        item.put("building_id", buildingId);
        item.put("prod_id", product.getProdId());
        item.put("prod_nm", product.getProdNm());
        item.put("prod_stock", stock);
        item.put("affiliate_id", product.getAffiliateId());
        return item;
    }

    private Integer intSlot(Map<String, Object> slots, String... keys) {
        Object value = slotValue(slots, keys);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String stringSlot(Map<String, Object> slots, String... keys) {
        Object value = slotValue(slots, keys);
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Object slotValue(Map<String, Object> slots, String... keys) {
        for (String key : keys) {
            if (slots.containsKey(key)) {
                return slots.get(key);
            }
        }
        return null;
    }
}
