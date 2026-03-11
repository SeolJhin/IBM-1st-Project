package org.myweb.uniplace.domain.ai.application.gateway;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai.fastapi")
public class AiGatewayProperties {

    private String baseUrl = "http://localhost:8000";
    private String executePath = "/api/v1/ai/execute";
    private String generalQaPath = "/api/v1/ai/chat/general-qa";
    private String aiAgentChatbotPath = "/api/v1/ai/chat/agent-chatbot";
    private String voiceChatbotPath = "/api/v1/ai/chat/voice-assistant";
    private String aiAgentRagSearchPath = "/api/v1/ai/search/rag";
    private String communityContentSearchPath = "/api/v1/ai/community/content-search";
    private String communityContentModerationPath = "/api/v1/ai/community/content-moderation";
    private String contractRenewalRecommendPath = "/api/v1/ai/contracts/renewal-recommendations";
    private String contractAnomalyDetectionPath = "/api/v1/ai/contracts/anomaly-detections";
    private String roomAvailabilitySearchPath = "/api/v1/ai/rooms/availability-searches";
    private String commonSpaceRecommendPath = "/api/v1/ai/common-spaces/recommendations";
    private String paymentSummaryDocumentPath = "/api/v1/ai/payments/summary-documents";
    private String paymentStatusSummaryPath = "/api/v1/ai/payments/status-summaries";
    private String paymentOrderSuggestionPath = "/api/v1/ai/payments/order-suggestions";
    private String paymentOrderFormCreatePath = "/api/v1/ai/payments/order-forms";
    private String paymentOrderFormDownloadPath = "/api/v1/ai/payments/order-forms/downloads";
    private String roomserviceStockMonitorPath = "/api/v1/ai/operations/roomservice-stock-monitoring";
    private String complainPriorityClassifyPath = "/api/v1/ai/operations/complaint-priority-classification";
    // ✅ 추가
    private String reviewInfoPath = "/api/v1/ai/reviews/info";
    private String tourInfoPath = "/api/v1/ai/tours/info";
    private String companyInfoPath = "/api/v1/ai/company/info";
    private String buildingListPath = "/api/v1/ai/rooms/list";
    // ✅ 로그인 유저 전용
    private String myContractPath = "/api/v1/ai/my/contract";
    private String myReservationPath = "/api/v1/ai/my/reservation";
    private String myTourPath = "/api/v1/ai/my/tour";
    private String myComplainPath = "/api/v1/ai/my/complain";
    // ✅ 어드민 전용
    private String adminChatbotPath = "/api/v1/ai/chat/admin-chatbot";

    private String contractVersion = "2026-03-08.3";
    private int connectTimeoutMillis = 3000;
    private int readTimeoutSeconds = 30;
}