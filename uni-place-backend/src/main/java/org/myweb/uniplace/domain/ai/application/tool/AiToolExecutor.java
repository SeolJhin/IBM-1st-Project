package org.myweb.uniplace.domain.ai.application.tool;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;
import org.myweb.uniplace.domain.reservation.repository.TourReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * AI Tool Executor — Spring 측 tool 실행 서비스.
 *
 * [핵심 변경]
 * 기존: 각 UseCase마다 Java 코드로 DB 조회 → 하드코딩된 필터/정렬
 * 변경: LLM이 생성한 SQL을 JPA EntityManager로 직접 실행
 *      → 빌딩/테이블 추가 시 코드 변경 없음
 *      → 복잡한 JOIN, 집계 쿼리도 자연어로 처리 가능
 *
 * [보안]
 * SqlValidator로 SELECT만 허용, 테이블 화이트리스트, 위험 키워드 차단.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiToolExecutor {

    private final EntityManager em;
    private final TourReservationRepository tourRepository;

    @Transactional(readOnly = true)
    public AiToolResponse execute(AiToolRequest req) {
        String tool   = req.getTool();
        Map<String, Object> args = req.getArgs() != null ? req.getArgs() : Map.of();
        String userId = req.getUserId();

        log.info("[AiToolExecutor] tool={} userId={}", tool, userId);

        try {
            return switch (tool) {
                case "query_database"              -> executePublicSql(args);
                case "query_database_admin"        -> executeAdminSql(args, userId);   // AI 내부 집계용: requiresAuth 우회, userId 필요
                case "query_my_data"               -> executePrivateSql(args, userId);
                case "get_tour_available_slots"    -> getTourSlots(args);
                case "classify_complain_priority"  -> AiToolResponse.fail("관리자 API를 통해 처리됩니다.");
                default -> {
                    log.warn("[AiToolExecutor] 알 수 없는 tool: {}", tool);
                    yield AiToolResponse.fail("지원하지 않는 도구: " + tool);
                }
            };
        } catch (IllegalArgumentException e) {
            // SQL 검증 실패
            log.warn("[AiToolExecutor] SQL 검증 실패: {}", e.getMessage());
            return AiToolResponse.fail("허용되지 않는 쿼리입니다: " + e.getMessage());
        } catch (Exception e) {
            log.error("[AiToolExecutor] 실행 오류 tool={}: {}", tool, e.getMessage(), e);
            return AiToolResponse.fail("도구 실행 중 오류가 발생했습니다.");
        }
    }

    // ── 어드민 SQL 실행 (requiresAuth 우회 — ADMIN 엔드포인트 전용) ──────────

    private AiToolResponse executeAdminSql(Map<String, Object> args, String userId) {
        // AI 내부에서만 호출 가능 — userId가 있는(로그인된) 요청에서만 허용
        if (userId == null || userId.isBlank()) {
            log.warn("[AiToolExecutor] query_database_admin: userId 없음 → 차단");
            return AiToolResponse.authRequired();
        }
        String sql  = getString(args, "sql");
        String desc = getString(args, "description");

        if (sql == null || sql.isBlank()) {
            return AiToolResponse.fail("SQL이 전달되지 않았습니다.");
        }

        // SELECT 전용, 위험 키워드 차단 — 어드민도 DDL/DML 금지, 테이블 whitelist는 우회
        SqlValidator.validateAdmin(sql);

        log.info("[AiToolExecutor] SQL실행(어드민): {}", sql.substring(0, Math.min(150, sql.length())));
        List<Map<String, Object>> rows = runNativeQuery(sql, null);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("total", rows.size());
        if (desc != null) meta.put("description", desc);

        return AiToolResponse.ok(rows, meta);
    }

    // ── 공개 SQL 실행 ────────────────────────────────────────────────────────

    private AiToolResponse executePublicSql(Map<String, Object> args) {
        String sql  = getString(args, "sql");
        String desc = getString(args, "description");

        if (sql == null || sql.isBlank()) {
            return AiToolResponse.fail("SQL이 전달되지 않았습니다.");
        }

        // 보안 검증
        SqlValidator.validate(sql);

        // 인증 필요 테이블 접근 시도 차단
        if (SqlValidator.requiresAuth(sql)) {
            return AiToolResponse.authRequired();
        }

        log.info("[AiToolExecutor] SQL실행(공개): {}", sql.substring(0, Math.min(150, sql.length())));
        List<Map<String, Object>> rows = runNativeQuery(sql, null);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("total", rows.size());
        if (desc != null) meta.put("description", desc);

        return AiToolResponse.ok(rows, meta);
    }

    // ── 개인 SQL 실행 (user_id 강제 치환) ────────────────────────────────────

    private AiToolResponse executePrivateSql(Map<String, Object> args, String userId) {
        if (userId == null || userId.isBlank()) {
            return AiToolResponse.authRequired();
        }

        String sql  = getString(args, "sql");
        String desc = getString(args, "description");

        if (sql == null || sql.isBlank()) {
            return AiToolResponse.fail("SQL이 전달되지 않았습니다.");
        }

        // 1단계: 구조 검증 (SELECT 전용, 테이블 화이트리스트, 위험 키워드)
        SqlValidator.validate(sql);

        // 2단계: SQL 내 모든 user_id = '...' 값을 인증된 userId로 강제 치환
        //         → AI가 타인 userId를 주입하는 취약점 원천 차단
        try {
            sql = SqlValidator.enforceUserId(sql, userId);
        } catch (IllegalArgumentException e) {
            log.warn("[AiToolExecutor] userId 강제 치환 실패: {}", e.getMessage());
            return AiToolResponse.fail(e.getMessage());
        }

        log.info("[AiToolExecutor] SQL실행(개인 userId={}): {}",
                userId, sql.substring(0, Math.min(150, sql.length())));
        List<Map<String, Object>> rows = runNativeQuery(sql, null);

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("total", rows.size());
        if (desc != null) meta.put("description", desc);

        return AiToolResponse.ok(rows, meta);
    }

    // ── 투어 가능 시간대 (비즈니스 로직 필요 — SQL 대체 불가) ─────────────────

    private AiToolResponse getTourSlots(Map<String, Object> args) {
        Integer roomId = getInt(args, "room_id");
        List<TourStatus> inactive = List.of(TourStatus.cancelled, TourStatus.ended);

        List<Map<String, Object>> slots = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int day = 1; day <= 7; day++) {
            LocalDate date = now.toLocalDate().plusDays(day);
            for (int hour : new int[]{10, 14, 16}) {
                LocalDateTime start = date.atTime(hour, 0);
                LocalDateTime end   = start.plusHours(1);
                boolean available   = (roomId == null) ||
                    !tourRepository.existsRoomTimeConflict(roomId, inactive, start, end);

                Map<String, Object> slot = new LinkedHashMap<>();
                slot.put("date",       date.toString());
                slot.put("start_time", start.toString());
                slot.put("end_time",   end.toString());
                slot.put("available",  available);
                slots.add(slot);
            }
        }

        String guide = "투어 예약은 원하는 방을 선택 후 날짜/시간을 선택하면 됩니다. 투어 시간은 1시간이며 현장 확인 후 계약 진행 가능합니다.";
        return AiToolResponse.ok(slots, Map.of("guide", guide));
    }

    // ── Native Query 실행 ────────────────────────────────────────────────────

    @SuppressWarnings({"unchecked", "rawtypes"})
    private List<Map<String, Object>> runNativeQuery(String sql, Map<String, Object> params) {
        String finalSql = appendLimit(sql, 50);
        List<String> columns = extractColumnNames(finalSql);

        var query = em.createNativeQuery(finalSql);
        if (params != null) {
            params.forEach(query::setParameter);
        }

        List rawResults;
        try {
            rawResults = query.getResultList();
        } catch (Exception e) {
            log.warn("[AiToolExecutor] 쿼리 실행 실패: {}", e.getMessage());
            throw e;
        }

        if (rawResults == null || rawResults.isEmpty()) return List.of();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object raw : rawResults) {
            Map<String, Object> row = new LinkedHashMap<>();

            if (raw instanceof Object[] arr) {
                // 다중 컬럼 결과 (일반 SELECT)
                for (int i = 0; i < arr.length; i++) {
                    String colName = (i < columns.size()) ? columns.get(i) : "col_" + i;
                    row.put(colName, convertValue(arr[i]));
                }
            } else {
                // 단일 값 결과 (COUNT(*), SUM(...) 등)
                String colName = columns.isEmpty() ? "result" : columns.get(0);
                row.put(colName, convertValue(raw));
            }
            result.add(row);
        }
        return result;
    }

    /**
     * SELECT 절에서 컬럼명/별칭 추출.
     * 별칭(AS ...)이 있으면 별칭 사용, 없으면 컬럼명 사용.
     */
    private List<String> extractColumnNames(String sql) {
        List<String> names = new ArrayList<>();
        try {
            // SELECT ... FROM 사이 추출
            String upper = sql.toUpperCase();
            int selectIdx = upper.indexOf("SELECT") + 6;
            int fromIdx   = upper.indexOf(" FROM ");
            if (fromIdx < 0) fromIdx = upper.indexOf("\nFROM");
            if (fromIdx < 0) return names;

            String selectPart = sql.substring(selectIdx, fromIdx).trim();

            // 괄호 안의 쉼표 무시하고 컬럼 분리
            List<String> cols = splitSelectColumns(selectPart);
            for (String col : cols) {
                col = col.trim();
                // AS 별칭이 있으면 별칭 사용
                String[] asParts = col.split("(?i)\\s+AS\\s+");
                if (asParts.length >= 2) {
                    names.add(asParts[asParts.length - 1].trim().replaceAll("[`\"'\\[\\]]", ""));
                } else {
                    // 테이블명.컬럼명 → 컬럼명만
                    String[] dotParts = col.split("\\.");
                    String colName = dotParts[dotParts.length - 1].trim()
                        .replaceAll("[`\"'\\[\\]]", "")
                        .replaceAll("\\s.*", ""); // 공백 이후 제거
                    names.add(colName.toLowerCase());
                }
            }
        } catch (Exception e) {
            log.debug("[AiToolExecutor] 컬럼명 파싱 실패, 인덱스 사용: {}", e.getMessage());
        }
        return names;
    }

    private List<String> splitSelectColumns(String selectPart) {
        List<String> result = new ArrayList<>();
        int depth = 0;
        StringBuilder current = new StringBuilder();
        for (char c : selectPart.toCharArray()) {
            if (c == '(') depth++;
            else if (c == ')') depth--;
            else if (c == ',' && depth == 0) {
                result.add(current.toString());
                current = new StringBuilder();
                continue;
            }
            current.append(c);
        }
        if (!current.isEmpty()) result.add(current.toString());
        return result;
    }

    /** LIMIT이 없으면 추가 */
    private String appendLimit(String sql, int maxRows) {
        if (!sql.toUpperCase().contains("LIMIT")) {
            return sql.stripTrailing().replaceAll(";$", "") + " LIMIT " + maxRows;
        }
        return sql;
    }

    /** DB 반환값을 JSON-friendly 타입으로 변환 */
    private Object convertValue(Object v) {
        if (v == null) return null;
        if (v instanceof java.math.BigDecimal bd) return bd.stripTrailingZeros().toPlainString();
        if (v instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toString();
        if (v instanceof java.sql.Date d) return d.toLocalDate().toString();
        if (v instanceof byte[] b) return new String(b);
        return v;
    }

    // ── 슬롯 헬퍼 ────────────────────────────────────────────────────────────

    private String getString(Map<String, Object> args, String key) {
        Object v = args.get(key);
        return v != null ? v.toString().trim() : null;
    }

    private Integer getInt(Map<String, Object> args, String key) {
        Object v = args.get(key);
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString().trim()); } catch (NumberFormatException e) { return null; }
    }
}