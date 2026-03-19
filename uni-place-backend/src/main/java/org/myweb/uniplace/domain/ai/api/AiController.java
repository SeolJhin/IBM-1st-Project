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
import org.myweb.uniplace.domain.ai.api.dto.request.PaymentOrderFormCreateRequest;
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
import org.myweb.uniplace.domain.ai.application.gateway.AiOrderFormDownloadProxy;
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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.client.RestClient;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ai")
public class AiController {

    private final AiOrchestratorService aiOrchestratorService;
    private final ObjectMapper objectMapper;
    private final AiOrderFormDownloadProxy aiOrderFormDownloadProxy;
    @Qualifier("aiRestClient")
    private final RestClient aiRestClient;

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
        // ✅ 로그인 상태면 SecurityContext에서 userId를 직접 추출해 주입
        // (클라이언트가 userId를 안 보내거나 잘못 보내도 서버가 보정)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String serverUserId = (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getName()))
                ? auth.getName()
                : null;

        AiGatewayRequest gatewayRequest = toGateway(request.getIntent(), request);

        // 서버에서 추출한 userId가 있으면 덮어씌움
        if (serverUserId != null) {
            gatewayRequest = AiGatewayRequest.builder()
                    .intent(gatewayRequest.getIntent())
                    .userId(serverUserId)
                    .userSegment(gatewayRequest.getUserSegment())
                    .prompt(gatewayRequest.getPrompt())
                    .slots(gatewayRequest.getSlots())
                    .build();
        }

        AiGatewayResponse response = aiOrchestratorService.handle(gatewayRequest);
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

        // ✅ TypeReference 사용 — 제네릭 타입 안전하게 변환
        Map<String, Object> slots = objectMapper.convertValue(request, new TypeReference<Map<String, Object>>() {});
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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/stock-alerts")
    public ApiResponse<Map<String, Object>> adminStockAlerts(@RequestParam(name = "adminId", required = false) String adminId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String resolvedAdminId = (adminId != null && !adminId.isBlank())
            ? adminId
            : (auth != null ? auth.getName() : "");

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = aiRestClient.get()
                .uri("/api/v1/ai/admin/stock-alerts?adminId={adminId}", resolvedAdminId)
                .retrieve()
                .body(Map.class);
            return ApiResponse.ok(response != null ? response : Map.of("alert", null));
        } catch (Exception e) {
            return ApiResponse.ok(Map.of("alert", null));
        }
    }

    @PostMapping("/chat/voice")
    public ApiResponse<AiChatResponse> voiceChatbot(@RequestBody VoiceChatbotRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String serverUserId = (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getName()))
                ? auth.getName()
                : null;

        AiGatewayRequest gatewayRequest = toGateway(request.getIntent(), request);

        if (serverUserId != null) {
            gatewayRequest = AiGatewayRequest.builder()
                    .intent(gatewayRequest.getIntent())
                    .userId(serverUserId)
                    .userSegment(gatewayRequest.getUserSegment())
                    .prompt(gatewayRequest.getPrompt())
                    .slots(gatewayRequest.getSlots())
                    .build();
        }

        AiGatewayResponse response = aiOrchestratorService.handle(gatewayRequest);
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

    @PostMapping("/payment/order-form")
    public ApiResponse<AiChatResponse> paymentOrderForm(@RequestBody PaymentOrderFormCreateRequest request) {
        AiGatewayResponse response = aiOrchestratorService.handle(toGateway(request.getIntent(), request));
        return ApiResponse.ok(AiChatResponse.from(response));
    }

    @GetMapping("/payment/order-form/download/{fileName}")
    public ResponseEntity<ByteArrayResource> downloadPaymentOrderForm(@PathVariable("fileName") String fileName) {
        return aiOrderFormDownloadProxy.download(fileName);
    }

    /**
     * ★ 직방/다방 프록시 엔드포인트
     * 브라우저는 직방 CORS 정책으로 직접 호출 불가 → Spring이 서버 사이드로 대신 호출
     * GET /ai/proxy/market?lat=...&lon=...&radius=...&room_type=...&rent_type=...&size_sqm=...
     */
    @GetMapping("/proxy/market")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Object> proxyMarketData(
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon,
            @RequestParam(name = "radius", defaultValue = "3") double radius,
            @RequestParam(name = "room_type", defaultValue = "all") String room_type,
            @RequestParam(name = "rent_type", defaultValue = "monthly_rent") String rent_type,
            @RequestParam(name = "size_sqm", required = false) Double size_sqm) {
        try {
            java.util.List<java.util.Map<String, Object>> listings = new java.util.ArrayList<>();

            // 직방 API 호출 (서버 사이드)
            try {
                String zigbangUrl = String.format(
                    "https://apis.zigbang.com/v2/items/map?lat1=%.6f&lat2=%.6f&lng1=%.6f&lng2=%.6f" +
                    "&deposit_gteq=0&rent_gteq=0&service_type=room&type=%s",
                    lat - radius / 111.0, lat + radius / 111.0,
                    lon - radius / 88.0,  lon + radius / 88.0,
                    "jeonse".equals(rent_type) ? "jeonse" : "rent"
                );

                org.springframework.web.client.RestClient restClient = org.springframework.web.client.RestClient.builder()
                    .defaultHeader("User-Agent", "Mozilla/5.0 (compatible)")
                    .defaultHeader("Referer", "https://www.zigbang.com/")
                    .build();

                String geoJson = restClient.get().uri(zigbangUrl).retrieve().body(String.class);
                com.fasterxml.jackson.databind.JsonNode geoNode = objectMapper.readTree(geoJson);
                java.util.List<String> itemIds = new java.util.ArrayList<>();
                if (geoNode.has("items")) {
                    for (com.fasterxml.jackson.databind.JsonNode item : geoNode.get("items")) {
                        String id = item.has("item_id") ? item.get("item_id").asText()
                                  : item.has("id")      ? item.get("id").asText() : null;
                        if (id != null) itemIds.add(id);
                        if (itemIds.size() >= 40) break;
                    }
                }

                if (!itemIds.isEmpty()) {
                    String detailUrl = "https://apis.zigbang.com/v2/items?item_ids=" +
                        String.join(",", itemIds) + "&domain=zigbang&withCoords=true&withTags=true&withPhotos=true";
                    String detailJson = restClient.get().uri(detailUrl).retrieve().body(String.class);
                    com.fasterxml.jackson.databind.JsonNode detailNode = objectMapper.readTree(detailJson);
                    if (detailNode.has("items")) {
                        for (com.fasterxml.jackson.databind.JsonNode item : detailNode.get("items")) {
                            long rent = item.has("rent") ? item.get("rent").asLong() : 0;
                            if (rent <= 0) continue;
                            double area = item.has("전용면적") ? item.get("전용면적").asDouble()
                                        : item.has("area") ? item.get("area").asDouble() : 0;
                            if (size_sqm != null && area > 0 && (area < size_sqm * 0.65 || area > size_sqm * 1.35)) continue;

                            java.util.Map<String, Object> listing = new java.util.LinkedHashMap<>();
                            listing.put("source", "직방");
                            listing.put("address", item.has("address") ? item.get("address").asText() : "");
                            listing.put("size_sqm", area);
                            listing.put("size_pyeong", area > 0 ? Math.round(area / 3.305 * 10.0) / 10.0 : null);
                            listing.put("floor", item.has("floor") ? item.get("floor").asText() : "");
                            listing.put("deposit_wan", item.has("deposit") ? item.get("deposit").asLong() / 10000 : 0);
                            listing.put("monthly_rent_wan", rent / 10000);
                            listing.put("rent_type", "jeonse".equals(rent_type) ? "jeonse" : "monthly_rent");

                            String imageUrl = null;
                            if (item.has("photos") && item.get("photos").isArray() && item.get("photos").size() > 0) {
                                imageUrl = item.get("photos").get(0).has("path") ? item.get("photos").get(0).get("path").asText() : null;
                            }
                            listing.put("image_url", imageUrl);
                            listing.put("listing_url", item.has("item_id") ? "https://www.zigbang.com/home/room/" + item.get("item_id").asText() : null);
                            listing.put("building_name", item.has("building_name") ? item.get("building_name").asText() : "");
                            listing.put("is_realtime", true);
                            listings.add(listing);
                        }
                    }
                }
            } catch (Exception e) {
                // 직방 실패 시 조용히 무시 (다방으로 fallback)
            }

            // 다방 fallback (직방 5건 미만 시)
            if (listings.size() < 5) {
                try {
                    String typeCode = "one_room".equals(room_type) ? "1" : "two_room".equals(room_type) ? "2" : "1";
                    String saleType = "jeonse".equals(rent_type) ? "2" : "1";
                    String dabangUrl = String.format(
                        "https://www.dabangapp.com/api/3/room/bbox?bbox=%.6f,%.6f,%.6f,%.6f&page=1&per_page=40&room_type=%s&sale_type=%s&zoom=14",
                        lon - radius / 88.0, lat - radius / 111.0,
                        lon + radius / 88.0, lat + radius / 111.0,
                        typeCode, saleType
                    );
                    org.springframework.web.client.RestClient rc = org.springframework.web.client.RestClient.builder()
                        .defaultHeader("User-Agent", "Mozilla/5.0 (compatible)")
                        .defaultHeader("Referer", "https://www.dabangapp.com/")
                        .build();
                    String dabangJson = rc.get().uri(dabangUrl).retrieve().body(String.class);
                    com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(dabangJson);
                    if (node.has("rooms")) {
                        for (com.fasterxml.jackson.databind.JsonNode item : node.get("rooms")) {
                            long rent = item.has("rent") ? item.get("rent").asLong() : 0;
                            if (rent <= 0) continue;
                            double area = item.has("area") ? item.get("area").asDouble() : 0;
                            if (size_sqm != null && area > 0 && (area < size_sqm * 0.65 || area > size_sqm * 1.35)) continue;

                            java.util.Map<String, Object> listing = new java.util.LinkedHashMap<>();
                            listing.put("source", "다방");
                            listing.put("address", item.has("address") ? item.get("address").asText() : "");
                            listing.put("size_sqm", area);
                            listing.put("size_pyeong", area > 0 ? Math.round(area / 3.305 * 10.0) / 10.0 : null);
                            listing.put("floor", item.has("floor") ? item.get("floor").asText() : "");
                            listing.put("deposit_wan", item.has("deposit") ? item.get("deposit").asLong() / 10000 : 0);
                            listing.put("monthly_rent_wan", rent / 10000);
                            listing.put("rent_type", "jeonse".equals(rent_type) ? "jeonse" : "monthly_rent");
                            listing.put("image_url", item.has("img_url") ? item.get("img_url").asText() : null);
                            listing.put("listing_url", item.has("id") ? "https://www.dabangapp.com/room/" + item.get("id").asText() : null);
                            listing.put("building_name", item.has("building_name") ? item.get("building_name").asText() : "");
                            listing.put("is_realtime", true);
                            listings.add(listing);
                        }
                    }
                } catch (Exception ignored) {}
            }

            return ApiResponse.ok(java.util.Map.of("listings", listings, "count", listings.size()));
        } catch (Exception e) {
            return ApiResponse.ok(java.util.Map.of("listings", java.util.List.of(), "count", 0, "error", e.getMessage()));
        }
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