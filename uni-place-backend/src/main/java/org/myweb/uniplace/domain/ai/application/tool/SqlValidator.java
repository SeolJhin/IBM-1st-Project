package org.myweb.uniplace.domain.ai.application.tool;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * LLM이 생성한 SQL 안전성 검증.
 *
 * SELECT만 허용, 허용된 테이블만 접근 가능, 위험 키워드 차단.
 */
public class SqlValidator {

    /** 조회 허용 테이블 화이트리스트 */
    private static final Set<String> ALLOWED_TABLES = Set.of(
        // 실제 DB: rooms (복수), LLM이 room(단수)을 생성할 수 있으므로 양쪽 허용
        "building", "room", "rooms", "reviews", "common_space",
        "room_reservation", "board", "notice", "faq", "company_info",
        "contract", "space_reservations", "complain", "payment",
        "product_building_stock"
    );

    /** 절대 허용 안 되는 키워드 */
    private static final Set<String> FORBIDDEN = Set.of(
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
        "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE", "CALL", "MERGE",
        "INTO", "LOAD_FILE", "OUTFILE", "DUMPFILE", "SLEEP", "BENCHMARK"
    );

    private static final Pattern ONLY_SELECT = Pattern.compile(
        "^\\s*SELECT\\b.*", Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    private static final Pattern SEMICOLON_MULTI = Pattern.compile(";.+", Pattern.DOTALL);

    /**
     * SQL 유효성 검사.
     * @throws IllegalArgumentException 허용되지 않는 SQL인 경우
     */
    public static void validate(String sql) {
        if (sql == null || sql.isBlank()) {
            throw new IllegalArgumentException("SQL이 비어있습니다.");
        }

        String upper = sql.toUpperCase().trim();

        // SELECT로 시작해야 함
        if (!ONLY_SELECT.matcher(sql).matches()) {
            throw new IllegalArgumentException("SELECT 쿼리만 허용됩니다.");
        }

        // 세미콜론 뒤 추가 쿼리 금지 (SQL stacking)
        if (SEMICOLON_MULTI.matcher(sql.trim()).find()) {
            throw new IllegalArgumentException("여러 쿼리를 동시에 실행할 수 없습니다.");
        }

        // 위험 키워드 차단
        for (String keyword : FORBIDDEN) {
            // 단어 경계로 매칭 (EXECUTE 안에 있는 SELECT 같은 오탐 방지)
            if (Pattern.compile("\\b" + keyword + "\\b").matcher(upper).find()) {
                throw new IllegalArgumentException("허용되지 않는 SQL 키워드: " + keyword);
            }
        }

        // 테이블명 화이트리스트 체크
        // FROM, JOIN 뒤에 오는 테이블명 추출
        Pattern tablePattern = Pattern.compile(
            "(?:FROM|JOIN)\\s+([a-zA-Z_][a-zA-Z0-9_]*)",
            Pattern.CASE_INSENSITIVE
        );
        java.util.regex.Matcher m = tablePattern.matcher(sql);
        while (m.find()) {
            String tableName = m.group(1).toLowerCase();
            if (!ALLOWED_TABLES.contains(tableName)) {
                throw new IllegalArgumentException("허용되지 않는 테이블: " + tableName);
            }
        }
    }

    /** 로그인 필요 테이블이 SQL에 포함되어 있는지 확인 */
    public static boolean requiresAuth(String sql) {
        Set<String> authTables = Set.of("contract", "space_reservations", "complain", "payment");
        String lower = sql.toLowerCase();
        for (String t : authTables) {
            if (lower.contains(t)) return true;
        }
        return false;
    }
}