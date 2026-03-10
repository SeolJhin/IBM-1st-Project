package org.myweb.uniplace.domain.support.infrastructure;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Python AI 서버 호출 클라이언트
 * POST /api/v1/ai/operations/complaint-priority-classification
 */
@Slf4j
@Component
public class ComplainAiClient {

    @Value("${ai.server.url:http://localhost:8000}")
    private String aiServerUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public AiClassifyResult classify(Integer compId, String title, String content) {
        String url = aiServerUrl + "/api/v1/ai/operations/complaint-priority-classification";

        // Python ComplainPriorityClassifyRequest 형식에 맞게 전달
        Map<String, Object> body = new HashMap<>();
        body.put("compId", compId);
        body.put("compTitle", title != null ? title : "");
        body.put("compCtnt", content != null ? content : "");

        try {
            ResponseEntity<AiRawResponse> res =
                    restTemplate.postForEntity(url, body, AiRawResponse.class);

            AiRawResponse raw = res.getBody();
            if (raw == null) return null;

            // answer = "high"|"medium"|"low"
            // metadata.ai_reason = 판단 근거
            String importance = raw.getAnswer();
            String aiReason = raw.getMetadata() != null
                    ? (String) raw.getMetadata().get("ai_reason")
                    : null;

            return new AiClassifyResult(importance, aiReason);

        } catch (Exception e) {
            // AI 서버 오류여도 민원 등록은 정상 처리
            log.warn("[ComplainAiClient] AI 분류 실패 compId={} error={}", compId, e.getMessage());
            return null;
        }
    }

    // Python AiResponse 매핑용 내부 클래스
    @Getter @Setter
    public static class AiRawResponse {
        private String answer;
        private Double confidence;
        private Map<String, Object> metadata;
    }

    // AI 분류 결과 반환용
    @Getter
    public static class AiClassifyResult {
        private final String importance;  // "high" | "medium" | "low"
        private final String aiReason;

        public AiClassifyResult(String importance, String aiReason) {
            this.importance = importance;
            this.aiReason = aiReason;
        }
    }
}