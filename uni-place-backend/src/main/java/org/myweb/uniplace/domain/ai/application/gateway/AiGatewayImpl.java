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
                    } catch (IOException ignored) {}
                    throw new AiServiceException(
                        "AI gateway call failed [status=" + res.getStatusCode().value()
                        + ", path=" + path + ", body=" + body + "]");
                })
                .body(AiGatewayResponse.class);

            if (response == null) throw new AiServiceException("AI gateway call failed [empty response body]");
            return response;
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AiServiceException("AI gateway call failed", e);
        }
    }

    private String resolvePath(AiGatewayRequest request) {
        if (request == null || request.getIntent() == null) return properties.getExecutePath();

        return switch (request.getIntent()) {
            case GENERAL_QA           -> properties.getGeneralQaPath();
            case AI_AGENT_CHATBOT     -> properties.getAiAgentChatbotPath();
            case VOICE_CHATBOT        -> properties.getVoiceChatbotPath();
            case AI_AGENT_RAG_SEARCH  -> properties.getAiAgentRagSearchPath();
            case COMMUNITY_CONTENT_SEARCH     -> properties.getCommunityContentSearchPath();
            case COMMUNITY_CONTENT_MODERATION -> properties.getCommunityContentModerationPath();
            case CONTRACT_RENEWAL_RECOMMEND   -> properties.getContractRenewalRecommendPath();
            case CONTRACT_ANOMALY_DETECTION   -> properties.getContractAnomalyDetectionPath();
            case ROOM_AVAILABILITY_SEARCH     -> properties.getRoomAvailabilitySearchPath();
            case COMMON_SPACE_RECOMMEND       -> properties.getCommonSpaceRecommendPath();
            case PAYMENT_SUMMARY_DOCUMENT     -> properties.getPaymentSummaryDocumentPath();
            case PAYMENT_STATUS_SUMMARY       -> properties.getPaymentStatusSummaryPath();
            case PAYMENT_ORDER_SUGGESTION     -> properties.getPaymentOrderSuggestionPath();
            case ROOMSERVICE_STOCK_MONITOR    -> properties.getRoomserviceStockMonitorPath();
            case COMPLAIN_PRIORITY_CLASSIFY   -> properties.getComplainPriorityClassifyPath();
            // ✅ 추가
            case REVIEW_INFO  -> properties.getReviewInfoPath();
            case TOUR_INFO    -> properties.getTourInfoPath();
            case COMPANY_INFO -> properties.getCompanyInfoPath();
            case BUILDING_LIST    -> properties.getBuildingListPath();
            case MY_CONTRACT     -> properties.getMyContractPath();
            case MY_RESERVATION  -> properties.getMyReservationPath();
            case MY_TOUR         -> properties.getMyTourPath();
            case MY_COMPLAIN     -> properties.getMyComplainPath();
            case ADMIN_CHATBOT   -> properties.getAdminChatbotPath();
            default -> properties.getExecutePath();
        };
    }
}