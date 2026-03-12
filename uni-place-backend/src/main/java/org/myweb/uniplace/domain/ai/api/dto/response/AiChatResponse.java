package org.myweb.uniplace.domain.ai.api.dto.response;

import java.util.List;
import java.util.Map;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;

@Getter
@Builder
public class AiChatResponse {

    private String answer;
    private Double confidence;
    private Map<String, Object> metadata;
    private List<Map<String, Object>> buttons;  // metadata.action_buttons를 최상위로 노출

    @SuppressWarnings("unchecked")
    public static AiChatResponse from(AiGatewayResponse response) {
        if (response == null) {
            return AiChatResponse.builder().build();
        }
        Map<String, Object> meta = response.getMetadata();
        List<Map<String, Object>> buttons = null;
        if (meta != null && meta.get("action_buttons") instanceof List<?> raw) {
            try { buttons = (List<Map<String, Object>>) raw; } catch (ClassCastException ignored) {}
        }
        return AiChatResponse.builder()
            .answer(response.getAnswer())
            .confidence(response.getConfidence())
            .metadata(meta)
            .buttons(buttons)
            .build();
    }
}