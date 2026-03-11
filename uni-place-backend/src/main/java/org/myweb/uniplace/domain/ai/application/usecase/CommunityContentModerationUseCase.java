package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.application.moderation.BannedWordService;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

@Component
public class CommunityContentModerationUseCase extends AbstractForwardUseCase {

    private final BannedWordService bannedWordService;

    public CommunityContentModerationUseCase(
            AiGateway aiGateway,
            BannedWordService bannedWordService
    ) {
        super(aiGateway);
        this.bannedWordService = bannedWordService;
    }

    @Override
    public AiGatewayResponse execute(AiGatewayRequest request) {

        Map<String, Object> slots = request.getSlots();

        if (slots != null && slots.get("content") != null) {
            String content = String.valueOf(slots.get("content"));
            String filtered = bannedWordService.filter(content);
            slots.put("content", filtered);
        }
        return super.execute(request);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.COMMUNITY_CONTENT_MODERATION;
    }
}