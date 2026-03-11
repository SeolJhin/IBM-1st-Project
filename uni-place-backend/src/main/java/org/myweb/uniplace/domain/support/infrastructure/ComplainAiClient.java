package org.myweb.uniplace.domain.support.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.support.domain.enums.ComplainImportance;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ComplainAiClient {

    @Qualifier("aiRestClient")
    private final RestClient aiRestClient;

    private static final String ENDPOINT = "/api/v1/ai/operations/complaint-priority-classification";

    public AiClassifyResult classify(String compTitle, String compCtnt) {
        try {
            Map<String, String> body = Map.of(
                    "comp_title", compTitle != null ? compTitle : "",
                    "comp_ctnt",  compCtnt  != null ? compCtnt  : ""
            );

            Map response = aiRestClient.post()
                    .uri(ENDPOINT)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                String importanceStr = String.valueOf(response.getOrDefault("importance", "medium"));

                // Python은 "ai_reason" 키로 반환
                String reason = String.valueOf(response.getOrDefault("ai_reason",
                                response.getOrDefault("reason", "")));

                ComplainImportance importance;
                try {
                    importance = ComplainImportance.valueOf(importanceStr.toLowerCase());
                } catch (IllegalArgumentException e) {
                    log.warn("[AI][CLASSIFY] 알 수 없는 importance 값: {}", importanceStr);
                    importance = ComplainImportance.medium;
                }

                log.info("[AI][CLASSIFY] 분류 완료 → importance={}, reason={}", importance, reason);
                return new AiClassifyResult(importance, reason);
            }

        } catch (Exception e) {
            log.warn("[AI][CLASSIFY] AI 분류 실패 (민원 등록은 정상 처리됨): {}", e.getMessage());
        }

        return null;
    }

    public record AiClassifyResult(ComplainImportance importance, String reason) {}
}