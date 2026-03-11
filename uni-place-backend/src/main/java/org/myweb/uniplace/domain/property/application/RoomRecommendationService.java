// 경로: org/myweb/uniplace/domain/property/application/RoomRecommendationService.java
package org.myweb.uniplace.domain.property.application;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.property.api.dto.response.RoomRecommendationResponse;
import org.myweb.uniplace.domain.property.domain.entity.AiRoomRecommendation;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.infrastructure.RoomRecommendationAiClient;
import org.myweb.uniplace.domain.property.repository.AiRoomRecommendationRepository;
import org.myweb.uniplace.domain.property.repository.RoomRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AI 방 추천 Top3 서비스
 *
 * ① 매일 자정 자동 갱신   - @Scheduled
 * ② 관리자 수동 갱신       - refreshNow()
 * ③ 홈 화면 조회           - getLatestTop3()
 *
 * 처리 흐름:
 *   1. Native Query 로 방별 통계 집계 (평점·리뷰수·활성계약수)
 *   2. Python AI 서버에 통계 전달 → Top3 + 이유 수신
 *   3. ai_room_recommendation 테이블에 저장
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoomRecommendationService {

    private final AiRoomRecommendationRepository recRepository;
    private final RoomRepository                 roomRepository;
    private final RoomRecommendationAiClient     aiClient;

    @PersistenceContext
    private EntityManager em;

    // ──────────────────────────────────────────
    // ① 스케줄: 매일 자정 자동 갱신
    // ──────────────────────────────────────────
    @Scheduled(cron = "0 0 0 * * *")
    public void scheduledRefresh() {
        log.info("[RoomRecommendation] 자동 갱신 시작");
        refreshNow();
    }

    // ──────────────────────────────────────────
    // ② 수동 갱신 (관리자 버튼)
    // ──────────────────────────────────────────
    @Transactional
    public void refreshNow() {
        // 1. 방 통계 집계
        List<Map<String, Object>> stats = fetchRoomStats();
        if (stats.isEmpty()) {
            log.warn("[RoomRecommendation] 집계 가능한 방이 없습니다.");
            return;
        }

        // 2. AI 서버 호출
        List<Map<String, Object>> recommendations = aiClient.requestTop3(stats);
        if (recommendations.isEmpty()) {
            log.warn("[RoomRecommendation] AI 추천 결과가 없습니다.");
            return;
        }

        // 3. DB 저장
        LocalDateTime now = LocalDateTime.now();
        List<AiRoomRecommendation> toSave = new ArrayList<>();

        for (Map<String, Object> rec : recommendations) {
            int roomId = toInt(rec.get("room_id"));
            int rank   = toInt(rec.get("rank"));
            String reason = String.valueOf(rec.getOrDefault("reason", ""));

            // 통계에서 평점/리뷰수/계약수 찾기
            Map<String, Object> stat = stats.stream()
                    .filter(s -> toInt(s.get("room_id")) == roomId)
                    .findFirst().orElse(Map.of());

            Room room = roomRepository.findById(roomId).orElse(null);
            if (room == null) continue;

            toSave.add(AiRoomRecommendation.builder()
                    .room(room)
                    .rankNo(rank)
                    .aiReason(reason)
                    .avgRating(toBigDecimal(stat.get("avg_rating")))
                    .reviewCount(toInt(stat.get("review_count")))
                    .contractCount(toInt(stat.get("contract_count")))
                    .generatedAt(now)
                    .build());
        }

        recRepository.saveAll(toSave);
        log.info("[RoomRecommendation] Top3 저장 완료: {}건", toSave.size());
    }

    // ──────────────────────────────────────────
    // ③ 홈 화면 조회 (최신 Top3)
    // ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RoomRecommendationResponse> getLatestTop3() {
        return recRepository.findLatestTop3().stream()
                .map(RoomRecommendationResponse::fromEntity)
                .toList();
    }

    // ──────────────────────────────────────────
    // Native Query: 방별 통계 집계
    // ──────────────────────────────────────────
    /**
     * 삭제되지 않은 available 방들의 평점·리뷰·활성계약 수를 집계
     * 최대 20개 반환 (Python AI 서버에서 Top6 추림)
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchRoomStats() {
        String sql = """
            SELECT
                r.room_id        AS room_id,
                b.building_nm    AS building_nm,
                r.room_type      AS room_type,
                r.rent_price     AS rent_price,
                r.floor          AS floor,
                COALESCE(AVG(rv.rating), 0)           AS avg_rating,
                COUNT(DISTINCT rv.review_id)           AS review_count,
                COUNT(DISTINCT c.contract_id)          AS contract_count
            FROM rooms r
            INNER JOIN building b ON b.building_id = r.building_id
            LEFT JOIN reviews rv  ON rv.room_id = r.room_id
            LEFT JOIN contract c  ON c.room_id   = r.room_id
                                 AND c.contract_st = 'active'
            WHERE r.delete_yn  = 'N'
              AND b.delete_yn  = 'N'
              AND r.room_st    = 'available'
            GROUP BY r.room_id, b.building_nm, r.room_type, r.rent_price, r.floor
            ORDER BY avg_rating DESC, review_count DESC
            LIMIT 20
            """;

        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            result.add(Map.of(
                    "room_id",        row[0],
                    "building_nm",    row[1] != null ? row[1] : "",
                    "room_type",      row[2] != null ? row[2] : "",
                    "rent_price",     row[3] != null ? ((BigDecimal) row[3]).intValue() : 0,
                    "floor",          row[4] != null ? row[4] : 0,
                    "avg_rating",     row[5] != null ? ((Number) row[5]).doubleValue() : 0.0,
                    "review_count",   row[6] != null ? ((Number) row[6]).intValue() : 0,
                    "contract_count", row[7] != null ? ((Number) row[7]).intValue() : 0
            ));
        }
        return result;
    }

    // ──────────────────────────────────────────
    // 유틸
    // ──────────────────────────────────────────
    private static int toInt(Object o) {
        if (o == null) return 0;
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(o.toString()); } catch (Exception e) { return 0; }
    }

    private static BigDecimal toBigDecimal(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal bd) return bd;
        if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(o.toString()); } catch (Exception e) { return BigDecimal.ZERO; }
    }
}
