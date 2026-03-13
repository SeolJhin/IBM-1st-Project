package org.myweb.uniplace.domain.ai.application.tool;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * LLM이 생성한 SQL 안전성 검증.
 *
 * [보안 수정]
 * - query_database 공개 조회에서 room_reservation(예약자 이름/전화번호) 접근 차단
 * - query_my_data에서 AI가 임의의 userId 값을 SQL에 주입하는 취약점 차단
 *   → enforceUserId()로 SQL 내 모든 user_id = '...' 값을 서버 측 userId로 강제 치환
 * - space_reservations: AUTH_REQUIRED에서 제외 (예약 시간대는 비민감 공개 데이터)
 *   단, user_id / sr_no_people 컬럼 직접 SELECT는 코드 레벨에서 차단
 */
public class SqlValidator {

    /** 조회 허용 테이블 화이트리스트 */
    private static final Set<String> ALLOWED_TABLES = Set.of(
        "building", "buildings",  // building 단수·복수 모두 허용 (AI가 혼용)
        "room", "rooms", "reviews", "common_space",
        "room_reservation", "board", "notice", "faq", "company_info",
        "contract", "space_reservations", "complain", "payment", "qna",
        "product_building_stock", "service_goods",
        "orders", "order_items", "product",
        "monthly_charge",
        "banner", "affiliate", "users"
    );

    /**
     * query_database(비인증)에서 접근 불가 테이블.
     * space_reservations는 예약 시간대(sr_start_at/sr_end_at)만 조회하는 용도로
     * 비인증 접근을 허용. 단, 개인정보 컬럼(user_id, sr_no_people)은
     * checkRestrictedColumns()에서 SELECT 레벨로 별도 차단.
     * room_reservation: user_id 컬럼이 없어 query_my_data로도 조회 불가.
     */
    private static final Set<String> AUTH_REQUIRED_TABLES = Set.of(
        "contract", "complain", "payment", "monthly_charge"
        // space_reservations: 제거 — 예약 시간대는 공개 데이터, 컬럼 레벨 차단으로 대응
        // room_reservation: user_id 없음 → 비인증 조회 허용, AI 프롬프트에서 개인정보 컬럼 제한
    );

    /**
     * 테이블별 비인증 SELECT 금지 컬럼 목록.
     * space_reservations에서 user_id(개인 식별자), sr_no_people(사용 인원)은
     * 공개 조회(query_database)에서 SELECT 불가.
     */
    private static final Map<String, List<String>> RESTRICTED_COLUMNS = Map.of(
        "space_reservations", List.of("user_id", "sr_no_people")
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
     * 어드민 전용 SQL 유효성 검사.
     * - 테이블 화이트리스트 체크 생략 (어드민은 모든 테이블 조회 가능)
     * - DDL/DML 금지 키워드 및 SELECT 전용 체크는 동일하게 적용
     * @throws IllegalArgumentException 허용되지 않는 SQL인 경우
     */
    public static void validateAdmin(String sql) {
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

        // 위험 키워드 차단 (DDL/DML/인젝션)
        for (String keyword : FORBIDDEN) {
            if (Pattern.compile("\\b" + keyword + "\\b").matcher(upper).find()) {
                throw new IllegalArgumentException("허용되지 않는 SQL 키워드: " + keyword);
            }
        }
        // 테이블 화이트리스트 체크 생략 — 어드민은 전체 테이블 접근 허용
    }

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
            if (Pattern.compile("\\b" + keyword + "\\b").matcher(upper).find()) {
                throw new IllegalArgumentException("허용되지 않는 SQL 키워드: " + keyword);
            }
        }

        // 테이블명 화이트리스트 체크
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

        // 테이블별 제한 컬럼 SELECT 차단 (예: space_reservations.user_id)
        checkRestrictedColumns(sql);
    }

    /**
     * 테이블별 개인정보 컬럼을 SELECT 절에서 직접 조회하는 시도를 차단.
     * space_reservations의 user_id, sr_no_people은 공개 조회 불가.
     *
     * 탐지 패턴: alias.column 또는 단독 column 형태 모두 검사.
     * SELECT * 도 차단하여 우회 방지.
     */
    private static void checkRestrictedColumns(String sql) {
        String lower = sql.toLowerCase();

        for (Map.Entry<String, List<String>> entry : RESTRICTED_COLUMNS.entrySet()) {
            String table = entry.getKey();
            if (!lower.contains(table)) continue;

            // SELECT * 차단 (해당 테이블이 쿼리에 포함된 경우)
            if (lower.matches("(?s).*select\\s+\\*.*")) {
                throw new IllegalArgumentException(
                    table + " 테이블이 포함된 쿼리에서 SELECT * 는 허용되지 않습니다. 필요한 컬럼만 명시하세요."
                );
            }

            // 제한 컬럼 개별 차단 (alias.col 또는 단독 col 패턴)
            for (String col : entry.getValue()) {
                Pattern colPattern = Pattern.compile(
                    "(?i)\\b(?:[a-z_][a-z0-9_]*\\.)?" + Pattern.quote(col) + "\\b"
                );
                if (colPattern.matcher(lower).find()) {
                    throw new IllegalArgumentException(
                        table + "." + col + " 컬럼은 공개 조회가 허용되지 않습니다."
                    );
                }
            }
        }
    }

    /**
     * 비인증 공개 조회(query_database)에서 인증 필요 테이블 접근 여부 확인.
     * contract / complain / payment 는 반드시 로그인 후 query_my_data로만 접근.
     * space_reservations는 checkRestrictedColumns()에서 컬럼 레벨로 차단.
     */
    public static boolean requiresAuth(String sql) {
        String lower = sql.toLowerCase();
        // FROM/JOIN 뒤 테이블명 추출 후 auth 필요 테이블 포함 여부 확인
        Pattern tablePattern = Pattern.compile(
            "(?:FROM|JOIN)\\s+([a-zA-Z_][a-zA-Z0-9_]*)",
            Pattern.CASE_INSENSITIVE
        );
        java.util.regex.Matcher m = tablePattern.matcher(sql);
        while (m.find()) {
            if (AUTH_REQUIRED_TABLES.contains(m.group(1).toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    /**
     * [취약점 1 수정] query_my_data 전용 — SQL 내 user_id 조건값을 서버 측 userId로 강제 치환.
     *
     * AI가 생성한 SQL에 user_id = '다른유저ID' 또는 user_id = '{user_id}' 등
     * 임의 값이 들어올 수 있음. 이를 실제 인증된 userId로 덮어씌운다.
     *
     * 처리 대상 패턴:
     *   user_id = 'any_value'
     *   user_id = '{user_id}'
     *   user_id='{user_id}'
     *
     * @param sql    AI가 생성한 원본 SQL
     * @param userId Spring Security에서 추출한 실제 인증 userId
     * @return user_id 조건이 강제 치환된 SQL
     * @throws IllegalArgumentException user_id 조건이 아예 없는 경우
     */
    public static String enforceUserId(String sql, String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("인증된 userId가 없습니다.");
        }

        // SQL injection 방지: userId 내 홑따옴표 이스케이프
        String safeId = userId.replace("'", "''");

        // user_id = '...' 또는 user_id='...' 형태 모두 치환
        String replaced = sql.replaceAll(
            "(?i)user_id\\s*=\\s*'[^']*'",
            "user_id = '" + safeId + "'"
        );

        // 치환 후에도 user_id 조건이 없으면 차단
        if (!replaced.toLowerCase().contains("user_id")) {
            throw new IllegalArgumentException("개인 데이터 조회는 user_id 조건이 필수입니다.");
        }

        return replaced;
    }
}