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
    private String communityContentSearchPath = "/api/v1/ai/community/content-search";
    private String contractRenewalRecommendPath = "/api/v1/ai/contracts/renewal-recommendations";
    private String contractAnomalyDetectionPath = "/api/v1/ai/contracts/anomaly-detections";
    private String roomAvailabilitySearchPath = "/api/v1/ai/rooms/availability-searches";
    private String commonSpaceRecommendPath = "/api/v1/ai/common-spaces/recommendations";
    private String paymentSummaryDocumentPath = "/api/v1/ai/payments/summary-documents";
    private String paymentStatusSummaryPath = "/api/v1/ai/payments/status-summaries";
    private String roomserviceStockMonitorPath = "/api/v1/ai/operations/roomservice-stock-monitoring";
    private String complainPriorityClassifyPath = "/api/v1/ai/operations/complaint-priority-classification";
    private String contractVersion = "2026-03-08.1";
    private int connectTimeoutMillis = 3000;
    private int readTimeoutSeconds = 30;
}
