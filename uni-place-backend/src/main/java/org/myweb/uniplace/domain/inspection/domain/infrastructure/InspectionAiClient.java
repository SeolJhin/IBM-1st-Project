package org.myweb.uniplace.domain.inspection.domain.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Python AI 서버 - 이미지 비교 엔드포인트 호출 클라이언트
 * 기존 ComplainAiClient와 동일한 패턴으로 작성
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InspectionAiClient {

    @Qualifier("aiRestClient")
    private final RestClient aiRestClient;

    private static final String ENDPOINT = "/api/v1/ai/inspections/image-compare";

    /**
     * Python AI 서버에 이미지 비교 요청을 보냅니다.
     *
     * @param beforeImageB64 이전 점검 이미지 (base64). 첫 점검이면 null.
     * @param afterImageB64  금번 점검 이미지 (base64). 필수.
     * @param spaceType      공간 종류 (room / building / common_space)
     * @param spaceId        공간 ID
     */
    public InspectionAiResult compare(
            String beforeImageB64,
            String afterImageB64,
            String spaceType,
            Integer spaceId
    ) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("before_image_b64", beforeImageB64); // null이면 Python에서 첫 점검으로 처리
            body.put("after_image_b64", afterImageB64);
            body.put("space_type", spaceType);
            body.put("space_id", spaceId);

            Map<String, Object> response = aiRestClient.post()
                    .uri(ENDPOINT)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response == null) {
                log.warn("[INSPECTION_AI] AI 서버 응답이 null입니다.");
                return InspectionAiResult.empty();
            }

            double changePercent         = toDouble(response.get("change_percent"));
            boolean hasSignificantChange = toBoolean(response.get("has_significant_change"));
            boolean isFirstInspection    = toBoolean(response.get("is_first_inspection"));
            String diffImageB64          = (String) response.get("diff_image_b64");
            String aiSummary             = (String) response.getOrDefault("ai_summary", "");

            @SuppressWarnings("unchecked")
            List<Map<String, String>> issuesRaw =
                    (List<Map<String, String>>) response.getOrDefault("detected_issues", List.of());

            List<DetectedIssueDto> issues = issuesRaw.stream()
                    .map(m -> new DetectedIssueDto(
                            m.getOrDefault("issue_type", "general_wear"),
                            m.getOrDefault("severity", "medium"),
                            m.getOrDefault("description", "")
                    ))
                    .toList();

            log.info("[INSPECTION_AI] 분석 완료 - 변화율={}%, 감지 문제 수={}", changePercent, issues.size());

            return new InspectionAiResult(
                    changePercent, hasSignificantChange, isFirstInspection,
                    diffImageB64, aiSummary, issues
            );

        } catch (Exception e) {
            log.error("[INSPECTION_AI] AI 서버 호출 실패: {}", e.getMessage(), e);
            return InspectionAiResult.empty();
        }
    }

    // ── 유틸 ────────────────────────────────────────────────────────────────

    private double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(value.toString()); }
        catch (NumberFormatException e) { return 0.0; }
    }

    private boolean toBoolean(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean b) return b;
        return "true".equalsIgnoreCase(value.toString());
    }

    // ── 내부 DTO ────────────────────────────────────────────────────────────

    public record DetectedIssueDto(
            String issueType,
            String severity,
            String description
    ) {}

    public record InspectionAiResult(
            double changePercent,
            boolean hasSignificantChange,
            boolean isFirstInspection,
            String diffImageB64,
            String aiSummary,
            List<DetectedIssueDto> detectedIssues
    ) {
        public static InspectionAiResult empty() {
            return new InspectionAiResult(0.0, false, false, null, "AI 분석 실패", List.of());
        }
    }
}
