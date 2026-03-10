package org.myweb.uniplace.domain.ai.application.gateway;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.ai.exception.AiServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AiGatewayImpl implements AiGateway {

    private final RestClient restClient;
    private final AiGatewayProperties properties;

    public AiGatewayImpl(@Qualifier("aiRestClient") RestClient restClient, AiGatewayProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Override
    public AiGatewayResponse execute(AiGatewayRequest request) {
        String path = resolvePath(request);
        try {
            AiGatewayResponse response = restClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-AI-Contract-Version", properties.getContractVersion())
                .body(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = "";
                    try {
                        body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (IOException ignored) {
                        body = "";
                    }
                    throw new AiServiceException(
                        "AI gateway call failed"
                            + " [status=" + res.getStatusCode().value()
                            + ", path=" + path
                            + ", body=" + body + "]"
                    );
                })
                .body(AiGatewayResponse.class);

            if (response == null) {
                throw new AiServiceException("AI gateway call failed [empty response body]");
            }

            return response;
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
