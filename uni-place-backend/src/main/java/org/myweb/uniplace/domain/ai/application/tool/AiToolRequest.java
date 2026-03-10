package org.myweb.uniplace.domain.ai.application.tool;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Python → Spring tool 실행 요청 DTO.
 *
 * tool 종류:
 *   query_database         — 공개 SELECT SQL 실행
 *   query_my_data          — 개인 데이터 SELECT (user_id 검증 포함)
 *   get_tour_available_slots    — 투어 가능 시간대
 *   classify_complain_priority  — 민원 우선순위 분류
 */
@Getter
@NoArgsConstructor
public class AiToolRequest {
    /** tool 이름 */
    private String tool;
    /** LLM이 생성한 파라미터 (query_database의 경우 "sql", "description" 포함) */
    private Map<String, Object> args;
    /** 로그인 사용자 ID */
    private String userId;
}
