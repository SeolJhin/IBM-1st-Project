package org.myweb.uniplace.domain.ai.application.usecase;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

@Component
public class CommunityContentModerationUseCase extends AbstractForwardUseCase {

    public CommunityContentModerationUseCase(AiGateway aiGateway) {
        super(aiGateway);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.COMMUNITY_CONTENT_MODERATION;
    }
}
