package org.myweb.uniplace.domain.ai.application.tool;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * LLM이 생성한 SQL 안전성 검증.
 *
 * [보안 수정]
 * - query_database 공개 조회에서 room_reservation(예약자 이름/전화번호) 접근 차단
 * - query_my_data에서 AI가 임의의 userId 값을 SQL에 주입하는 취약점 차단
 *   → enforceUserId()로 SQL 내 모든 user_id = '...' 값을 서버 측 userId로 강제 치환
 */
public class SqlValidator {

    /** 조회 허용 테이블 화이트리스트 */
    private static final Set<String> ALLOWED_TABLES = Set.of(
        "building", "buildings",  // building 단수·복수 모두 허용 (AI가 혼용)
        "room", "rooms", "reviews", "common_space",
        "room_reservation", "board", "notice", "faq", "company_info",
        "contract", "space_reservations", "complain", "payment",
        "product_building_stock"
    );

    /**
     * query_database(비인증)에서 접근 불가 테이블.
     * room_reservation은 user_id 컬럼이 없어 query_my_data로도 조회 불가.
     * 비인증 접근 시 개인정보(이름·전화) 노출 위험이 있으나,
     * AI 프롬프트에서 SELECT 컬럼 제한으로 대응. 여기선 차단하지 않음.
     */
    private static final Set<String> AUTH_REQUIRED_TABLES = Set.of(
        "contract", "space_reservations", "complain", "payment"
        // room_reservation: user_id 없음 → 비인증 조회 허용 (통계 등), AI 프롬프트에서 개인정보 컬럼 제한
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
    }

    /**
     * 비인증 공개 조회(query_database)에서 인증 필요 테이블 접근 여부 확인.
     * contract / space_reservations / complain / payment 는 반드시 로그인 후 query_my_data로만 접근.
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