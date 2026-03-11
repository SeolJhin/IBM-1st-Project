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
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PostMapping("/chat/agent-chatbot")
    public ApiResponse<AiChatResponse> agentChatbot(@RequestBody AiAgentChatbotRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    /**
     * 어드민 전용 챗봇.
     *
     * [보안]
     * - @PreAuthorize("hasRole('ADMIN')") → ROLE_ADMIN 없으면 403 자동 반환
     * - userId를 Spring Security에서 직접 추출 → 클라이언트 위조 불가
     * - Python admin_tool_orchestrator로 라우팅 → 모든 테이블 접근 허용
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/chat/admin-chatbot")
    public ApiResponse<AiChatResponse> adminChatbot(@RequestBody AiAgentChatbotRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String adminId = auth.getName();   // JWT에서 추출 — 클라이언트 전달값 무시

        Map<String, Object> slots = objectMapper.convertValue(request, new java.util.HashMap<String, Object>().getClass());
        slots.put("userId", adminId);      // 서버 측 userId 강제 주입

        AiGatewayRequest gatewayReq = AiGatewayRequest.builder()
            .intent(AiIntent.ADMIN_CHATBOT)
            .userId(adminId)
            .prompt(request.getPrompt())
            .slots(slots)
            .build();

        // Python /api/v1/ai/chat/admin-chatbot 으로 포워딩
        AiGatewayResponse response = aiOrchestratorService.handle(gatewayReq);
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/chat/voice")
    public ApiResponse<AiChatResponse> voiceChatbot(@RequestBody VoiceChatbotRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @PostMapping("/contract/recommend")
    public ApiResponse<ContractRecommendResponse> recommendContract(@RequestBody ContractRecommendRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(ContractRecommendResponse.from(response));
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

    /**
     * ✅ 핵심 수정: slots에서 prompt도 꺼내서 AiGatewayRequest.prompt에 세팅
     * 기존: prompt = null → FastAPI에서 빈 질문으로 처리 → 에러
     * 수정: slots.prompt → AiGatewayRequest.prompt로 승격
     */
    private AiGatewayRequest toGateway(AiIntent intent, Object request) {
        Map<String, Object> slots = objectMapper.convertValue(request, new TypeReference<>() { });

        String userId = extractString(slots, "userId");
        String userSegment = extractString(slots, "userSegment");

        // ✅ prompt 추출 (slots에서 꺼내서 AiGatewayRequest.prompt에 세팅)
        String prompt = extractString(slots, "prompt");

        return AiGatewayRequest.builder()
            .intent(intent)
            .userId(userId)
            .userSegment(userSegment)
            .prompt(prompt)
            .slots(slots)
            .build();
    }

    private String extractString(Map<String, Object> slots, String key) {
        Object value = slots.get(key);
        if (value instanceof String str && !str.isBlank()) {
            return str;
        }
        return null;
    }
}