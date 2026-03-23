package org.myweb.uniplace.domain.ai.application;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.ai.exception.AiServiceException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AiOrchestratorServiceImpl implements AiOrchestratorService {

    private final AiIntentRouter aiIntentRouter;
    private static final Set<AiIntent> FAIL_SOFT_INTENTS = EnumSet.of(
        AiIntent.GENERAL_QA,
        AiIntent.AI_AGENT_CHATBOT,
        AiIntent.VOICE_CHATBOT,
        AiIntent.AI_AGENT_RAG_SEARCH,
        AiIntent.COMMUNITY_CONTENT_SEARCH,
        AiIntent.BUILDING_LIST,
        AiIntent.REVIEW_INFO,
        AiIntent.TOUR_INFO,
        AiIntent.COMPANY_INFO,
        AiIntent.ADMIN_CHATBOT
    );

    public AiOrchestratorServiceImpl(AiIntentRouter aiIntentRouter) {
        this.aiIntentRouter = aiIntentRouter;
    }

    @Override
    public AiGatewayResponse handle(AiGatewayRequest request) {
        try {
            return aiIntentRouter.route(request);
        } catch (AiServiceException e) {
            AiIntent intent = request != null ? request.getIntent() : null;
            if (intent != null && FAIL_SOFT_INTENTS.contains(intent) && isTransient(e)) {
                log.warn("[AI_FAIL_SOFT] intent={} cause={}", intent, safeMessage(e.getMessage()));
                return AiGatewayResponse.builder()
                    .answer(fallbackAnswer(intent))
                    .confidence(0.2)
                    .metadata(Map.of(
                        "error_kind", "AI_TRANSIENT_UPSTREAM",
                        "retryable", true,
                        "fail_soft", true,
                        "intent", intent.name()
                    ))
                    .build();
            }
            throw e;
        }
    }

    private boolean isTransient(AiServiceException e) {
        String msg = lower(e.getMessage());
        if (msg.contains("not configured")) {
            return false;
        }
        if (msg.contains("status=429")) return true;
        if (msg.contains("status=500") || msg.contains("status=502")
            || msg.contains("status=503") || msg.contains("status=504")) {
            return true;
        }
        if (hasAny(msg,
            "timeout", "timed out", "connection refused", "connection reset",
            "connection aborted", "temporarily unavailable", "service unavailable",
            "bad gateway", "upstream", "i/o error", "resourceaccessexception")) {
            return true;
        }

        Throwable cause = e.getCause();
        while (cause != null) {
            String cm = lower(cause.toString());
            if (hasAny(cm,
                "timeout", "timed out", "connection refused", "connection reset",
                "connection aborted", "temporarily unavailable", "service unavailable",
                "bad gateway", "upstream", "i/o error")) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    private boolean hasAny(String source, String... tokens) {
        for (String token : tokens) {
            if (source.contains(token)) return true;
        }
        return false;
    }

    private String lower(String value) {
        return value == null ? "" : value.toLowerCase();
    }

    private String safeMessage(String value) {
        if (value == null || value.isBlank()) return "";
        return value.length() > 200 ? value.substring(0, 200) : value;
    }

    private String fallbackAnswer(AiIntent intent) {
        if (intent == AiIntent.ADMIN_CHATBOT) {
            return "관리자 AI 응답이 일시적으로 지연되고 있습니다. 5~10초 후 다시 시도해 주세요.";
        }
        return "AI 응답이 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해 주세요.";
    }
}
