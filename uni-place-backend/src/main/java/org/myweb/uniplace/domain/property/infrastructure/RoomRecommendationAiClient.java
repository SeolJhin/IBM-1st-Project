// 경로: org/myweb/uniplace/domain/property/infrastructure/RoomRecommendationAiClient.java
package org.myweb.uniplace.domain.property.infrastructure;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Python AI 서버 — 방 추천 Top3 요청 클라이언트
 *
 * ✅ 변경사항:
 *   requestTop3(rooms, userQuery) 시그니처 추가
 *   - userQuery 없음(null) → 기본 종합 추천 (기존 동작)
 *   - userQuery 있음       → payload에 "user_query" 포함 → Python이 개인화 추천
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RoomRecommendationAiClient {

    @Qualifier("aiRestClient")
    private final RestClient aiRestClient;

    private final ObjectMapper objectMapper;

    private static final String ENDPOINT = "/api/v1/ai/operations/room-recommendation";

    /**
     * Python AI 서버에 후보 방 목록을 전송하고 Top3 결과를 받습니다.
     *
     * @param rooms     fetchRoomStats() 가 반환한 방 통계 목록
     * @param userQuery 사용자 자연어 쿼리 (null 또는 빈 문자열이면 기본 추천)
     * @return Top3 결과 Map 리스트 (room_id, rank, reason, score)
     */
    public List<Map<String, Object>> requestTop3(
            List<Map<String, Object>> rooms,
            String userQuery
    ) {
        try {
            // payload 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("rooms", rooms);

            // userQuery가 있으면 추가 (Python room_recommend.py의 "user_query" 키와 일치)
            if (userQuery != null && !userQuery.isBlank()) {
                requestBody.put("user_query", userQuery);
                log.info("[RoomRecommendAiClient] 개인화 요청: query='{}'", userQuery);
            }

            String responseBody = aiRestClient.post()
                    .uri(ENDPOINT)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                log.warn("[RoomRecommendAiClient] AI 서버 응답이 비어있습니다.");
                return List.of();
            }

            List<Map<String, Object>> result = objectMapper.readValue(
                    responseBody,
                    new TypeReference<>() {}
            );

            log.info("[RoomRecommendAiClient] AI Top3 수신: {}건", result.size());
            return result;

        } catch (Exception e) {
            log.error("[RoomRecommendAiClient] AI 호출 실패: {}", e.getMessage(), e);
            return List.of();
        }
    }
}