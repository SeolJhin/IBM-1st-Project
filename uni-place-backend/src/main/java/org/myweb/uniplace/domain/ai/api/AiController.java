package org.myweb.uniplace.domain.ai.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.ai.api.dto.request.AiChatRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.AiAgentChatbotRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.AiAgentRagSearchRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.CommonSpaceRecommendRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.CommunityContentModerationRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.CommunityContentSearchRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.ComplainPriorityRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.ContractAnomalyRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.ContractRecommendRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.PaymentOrderSuggestionRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.PaymentStatusSummaryRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.PaymentSummaryRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.RoomServiceStockMonitorRequest;
import org.myweb.uniplace.domain.ai.api.dto.request.VoiceChatbotRequest;
import org.myweb.uniplace.domain.ai.api.dto.response.AiChatResponse;
import org.myweb.uniplace.domain.ai.api.dto.response.ComplainPriorityResponse;
import org.myweb.uniplace.domain.ai.api.dto.response.ContractRecommendResponse;
import org.myweb.uniplace.domain.ai.api.dto.response.PaymentSummaryResponse;
import org.myweb.uniplace.domain.ai.api.dto.response.RoomSearchResponse;
import org.myweb.uniplace.domain.ai.application.AiOrchestratorService;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ai")
public class AiController {

    private final AiOrchestratorService aiOrchestratorService;
    private final ObjectMapper objectMapper;

    @PostMapping("/chat")
    public ApiResponse<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(
            AiGatewayRequest.builder()
                .intent(request.getIntent())
                .userId(request.getUserId())
                .userSegment(request.getUserSegment())
                .prompt(request.getPrompt())
                .slots(request.getSlots())
                .build()
        );

        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/contract/recommend")
    public ApiResponse<ContractRecommendResponse> recommendContract(@RequestBody ContractRecommendRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(ContractRecommendResponse.from(response));
    }

    @PostMapping("/chat/agent-chatbot")
    public ApiResponse<AiChatResponse> agentChatbot(@RequestBody AiAgentChatbotRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/chat/voice")
    public ApiResponse<AiChatResponse> voiceChatbot(@RequestBody VoiceChatbotRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/search/rag")
    public ApiResponse<AiChatResponse> ragSearch(@RequestBody AiAgentRagSearchRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/contract/anomaly")
    public ApiResponse<AiChatResponse> detectContractAnomaly(@RequestBody ContractAnomalyRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/room/search")
    public ApiResponse<RoomSearchResponse> searchRoom(@RequestBody RoomSearchRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(RoomSearchResponse.from(response));
    }

    @PostMapping("/payment/summary")
    public ApiResponse<PaymentSummaryResponse> paymentSummary(@RequestBody PaymentSummaryRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(PaymentSummaryResponse.from(response));
    }

    @PostMapping("/payment/status")
    public ApiResponse<AiChatResponse> paymentStatus(@RequestBody PaymentStatusSummaryRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/roomservice/stock")
    public ApiResponse<AiChatResponse> roomServiceStock(@RequestBody RoomServiceStockMonitorRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/common-space/recommend")
    public ApiResponse<AiChatResponse> commonSpaceRecommend(@RequestBody CommonSpaceRecommendRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/community/search")
    public ApiResponse<AiChatResponse> communitySearch(@RequestBody CommunityContentSearchRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        AiGatewayResponse response = aiOrchestratorService.handle(
            AiGatewayRequest.builder()
                .intent(request.getIntent())
                .userId(userId)
                .slots(objectMapper.convertValue(request, Map.class))
                .build()
        );

        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/community/moderate")
    public ApiResponse<AiChatResponse> communityModeration(@RequestBody CommunityContentModerationRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/complain/priority")
    public ApiResponse<ComplainPriorityResponse> complainPriority(@RequestBody ComplainPriorityRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(ComplainPriorityResponse.from(response));
    }

    @PostMapping("/payment/order-suggestion")
    public ApiResponse<AiChatResponse> paymentOrderSuggestion(@RequestBody PaymentOrderSuggestionRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    private AiGatewayRequest toGateway(org.myweb.uniplace.domain.ai.domain.AiIntent intent, Object request) {
        Map<String, Object> slots = objectMapper.convertValue(request, new TypeReference<>() { });

        String userId = null;
        Object maybeUserId = slots.get("userId");
        if (maybeUserId instanceof String) {
            userId = (String) maybeUserId;
        }

        String userSegment = null;
        Object maybeSegment = slots.get("userSegment");
        if (maybeSegment instanceof String) {
            userSegment = (String) maybeSegment;
        }

        return AiGatewayRequest.builder()
            .intent(intent)
            .userId(userId)
            .userSegment(userSegment)
            .slots(slots)
            .build();
    }
}
