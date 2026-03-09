package org.myweb.uniplace.domain.ai.application.gateway;

import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.ai.exception.AiServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class AiGatewayImpl implements AiGateway {

    private final WebClient webClient;
    private final AiGatewayProperties properties;

    public AiGatewayImpl(@Qualifier("aiWebClient") WebClient webClient, AiGatewayProperties properties) {
        this.webClient = webClient;
        this.properties = properties;
    }

    @Override
    public AiGatewayResponse execute(AiGatewayRequest request) {
        String path = resolvePath(request);
        try {
            return webClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-AI-Contract-Version", properties.getContractVersion())
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                    response.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new AiServiceException(
                                "AI gateway call failed"
                                    + " [status=" + response.statusCode().value()
                                    + ", path=" + path
                                    + ", body=" + body + "]"
                            )
                        ))
                )
                .bodyToMono(AiGatewayResponse.class)
                .block();
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AiServiceException("AI gateway call failed", e);
        }
    }

    private String resolvePath(AiGatewayRequest request) {
        if (request == null || request.getIntent() == null) {
            return properties.getExecutePath();
        }

        AiIntent intent = request.getIntent();
        switch (intent) {
            case GENERAL_QA:
                return properties.getGeneralQaPath();
            case AI_AGENT_CHATBOT:
                return properties.getAiAgentChatbotPath();
            case VOICE_CHATBOT:
                return properties.getVoiceChatbotPath();
            case AI_AGENT_RAG_SEARCH:
                return properties.getAiAgentRagSearchPath();
            case COMMUNITY_CONTENT_SEARCH:
                return properties.getCommunityContentSearchPath();
            case COMMUNITY_CONTENT_MODERATION:
                return properties.getCommunityContentModerationPath();
            case CONTRACT_RENEWAL_RECOMMEND:
                return properties.getContractRenewalRecommendPath();
            case CONTRACT_ANOMALY_DETECTION:
                return properties.getContractAnomalyDetectionPath();
            case ROOM_AVAILABILITY_SEARCH:
                return properties.getRoomAvailabilitySearchPath();
            case COMMON_SPACE_RECOMMEND:
                return properties.getCommonSpaceRecommendPath();
            case PAYMENT_SUMMARY_DOCUMENT:
                return properties.getPaymentSummaryDocumentPath();
            case PAYMENT_STATUS_SUMMARY:
                return properties.getPaymentStatusSummaryPath();
            case PAYMENT_ORDER_SUGGESTION:
                return properties.getPaymentOrderSuggestionPath();
            case ROOMSERVICE_STOCK_MONITOR:
                return properties.getRoomserviceStockMonitorPath();
            case COMPLAIN_PRIORITY_CLASSIFY:
                return properties.getComplainPriorityClassifyPath();
            default:
                return properties.getExecutePath();
        }
    }
}
