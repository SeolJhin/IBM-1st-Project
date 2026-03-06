package org.myweb.uniplace.domain.ai.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

import java.util.Map;

@Getter
public class AiChatRequest {

    private String userId;
    private String userSegment;

    @NotBlank
    private String prompt;

    private Map<String, Object> slots;

    public AiIntent getIntent() {
        return AiIntent.GENERAL_QA;
    }
}
