package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.HashMap;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.property.repository.BuildingRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentOrderFormCreateUseCase extends AbstractForwardUseCase {

    private final BuildingRepository buildingRepository;

    public PaymentOrderFormCreateUseCase(AiGateway aiGateway, BuildingRepository buildingRepository) {
        super(aiGateway);
        this.buildingRepository = buildingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        // buildingId로 빌딩 정보 조회 후 slots에 주입
        Object rawBid = slots.get("buildingId");
        if (rawBid != null) {
            try {
                int bid = Integer.parseInt(String.valueOf(rawBid));
                buildingRepository.findById(bid).ifPresent(b -> {
                    if (isBlank(slots.get("building_nm")))  slots.put("building_nm", b.getBuildingNm());
                    if (isBlank(slots.get("building_addr"))) slots.put("building_addr", b.getBuildingAddr());
                    if (isBlank(slots.get("lessor_nm")))    slots.put("lessor_nm", b.getBuildingLessorNm());
                    if (isBlank(slots.get("lessor_tel")))   slots.put("lessor_tel", b.getBuildingLessorTel());
                });
            } catch (NumberFormatException ignored) {}
        }

        AiGatewayRequest enriched = AiGatewayRequest.builder()
                .intent(request.getIntent())
                .userId(request.getUserId())
                .userSegment(request.getUserSegment())
                .prompt(request.getPrompt())
                .slots(slots)
                .build();
        return super.execute(enriched);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.PAYMENT_ORDER_FORM_CREATE;
    }

    private boolean isBlank(Object value) {
        return value == null || String.valueOf(value).trim().isEmpty();
    }
}
