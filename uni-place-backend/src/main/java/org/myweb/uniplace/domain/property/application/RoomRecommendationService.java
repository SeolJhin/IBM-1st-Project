// 경로: org/myweb/uniplace/domain/property/application/RoomRecommendationService.java
package org.myweb.uniplace.domain.property.application;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.file.domain.enums.FileRefType;
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
 * ① 매일 자정 자동 갱신     - @Scheduled → refreshNow()
 * ② 관리자 수동 갱신         - refreshNow()
 * ③ 홈 화면 조회 (캐시)      - getLatestTop3(null)   → DB 최신 결과 반환
 * ④ 개인화 실시간 조회        - getLatestTop3(query)  → AI 즉시 호출 후 반환
 *
 * 처리 흐름 (①②):
 *   1. Native Query로 방별 통계 집계 (평점·리뷰수·활성계약수 + 상세 정보)
 *   2. Python AI 서버에 전달 → Top3 + 추천 이유 수신
 *   3. ai_room_recommendation 테이블에 저장
 *
 * 처리 흐름 (④):
 *   1. 동일한 Native Query로 후보 방 집계
 *   2. user_query를 함께 AI 서버에 전달 → 개인화 Top3 수신
 *   3. DB 저장 없이 즉시 DTO로 변환하여 반환
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoomRecommendationService {

    private final AiRoomRecommendationRepository recRepository;
    private final RoomRepository                 roomRepository;
    private final RoomRecommendationAiClient     aiClient;
    private final FileService                    fileService;

    private static final Set<String> IMAGE_EXTS =
            Set.of(".png", ".jpg", ".jpeg", ".gif", ".webp");

    private boolean isImageExt(String ext) {
        return ext != null && IMAGE_EXTS.contains(ext.toLowerCase());
    }

    /** roomId → 썸네일 URL 조회 */
    private String fetchThumbnailUrl(int roomId) {
        List<FileResponse> files =
                fileService.getActiveFiles(FileRefType.ROOM.dbValue(), roomId);
        FileResponse first = files.stream()
                .filter(f -> f != null && isImageExt(f.getFileType()))
                .findFirst().orElse(null);
        return first != null ? first.getViewUrl() : null;
    }

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
    // ② 수동 갱신 (관리자 버튼) — 기존과 동일
    // ──────────────────────────────────────────
    @Transactional
    public void refreshNow() {
        List<Map<String, Object>> stats = fetchRoomStats();
        if (stats.isEmpty()) {
            log.warn("[RoomRecommendation] 집계 가능한 방이 없습니다.");
            return;
        }

        // user_query 없이 호출 → 기본 종합 추천
        List<Map<String, Object>> recommendations = aiClient.requestTop3(stats, null);
        if (recommendations.isEmpty()) {
            log.warn("[RoomRecommendation] AI 추천 결과가 없습니다.");
            return;
        }

        saveRecommendations(recommendations, stats);
    }

    // ──────────────────────────────────────────
    // ③ 홈 화면 조회
    //   - userQuery 없음 → DB 캐시(최신 배치 결과)
    //   - userQuery 있음 → AI 실시간 개인화 호출
    // ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<RoomRecommendationResponse> getLatestTop3(String userQuery) {

        // 개인화 쿼리가 있으면 실시간 AI 호출
        if (userQuery != null && !userQuery.isBlank()) {
            return getPersonalizedTop3(userQuery.trim());
        }

        // 쿼리 없으면 DB 캐시 반환 (기존 동작)
        return recRepository.findLatestTop3().stream()
                .map(rec -> {
                    RoomRecommendationResponse resp = RoomRecommendationResponse.fromEntity(rec);
                    if (rec.getRoom() != null) {
                        String thumbUrl = fetchThumbnailUrl(rec.getRoom().getRoomId());
                        return RoomRecommendationResponse.builder()
                                .rankNo(resp.getRankNo())
                                .roomId(resp.getRoomId())
                                .buildingNm(resp.getBuildingNm())
                                .buildingAddr(resp.getBuildingAddr())
                                .roomType(resp.getRoomType())
                                .rentPrice(resp.getRentPrice())
                                .floor(resp.getFloor())
                                .aiReason(resp.getAiReason())
                                .avgRating(resp.getAvgRating())
                                .reviewCount(resp.getReviewCount())
                                .contractCount(resp.getContractCount())
                                .thumbnailUrl(thumbUrl)
                                .generatedAt(resp.getGeneratedAt())
                                .build();
                    }
                    return resp;
                })
                .toList();
    }

    // ──────────────────────────────────────────
    // ④ 개인화 실시간 추천 (DB 저장 안 함)
    // ──────────────────────────────────────────
    private List<RoomRecommendationResponse> getPersonalizedTop3(String userQuery) {
        log.info("[RoomRecommendation] 개인화 추천 요청: query='{}'", userQuery);

        List<Map<String, Object>> stats = fetchRoomStats();
        if (stats.isEmpty()) {
            log.warn("[RoomRecommendation] 집계 가능한 방이 없습니다.");
            return List.of();
        }

        // user_query를 함께 AI 서버에 전달
        List<Map<String, Object>> aiResult = aiClient.requestTop3(stats, userQuery);
        if (aiResult.isEmpty()) {
            log.warn("[RoomRecommendation] 개인화 AI 결과 없음. 빈 목록 반환.");
            return List.of();
        }

        // DB 저장 없이 DTO로 즉시 변환
        LocalDateTime now = LocalDateTime.now();
        List<RoomRecommendationResponse> responses = new ArrayList<>();

        for (Map<String, Object> rec : aiResult) {
            int roomId = toInt(rec.get("room_id"));
            int rank   = toInt(rec.get("rank"));
            String reason = String.valueOf(rec.getOrDefault("reason", "AI 분석 완료"));

            Map<String, Object> stat = stats.stream()
                    .filter(s -> toInt(s.get("room_id")) == roomId)
                    .findFirst().orElse(Map.of());

            Room room = roomRepository.findById(roomId).orElse(null);
            if (room == null) continue;

            // AiRoomRecommendation 엔티티 없이 DTO 직접 구성
            responses.add(RoomRecommendationResponse.builder()
                    .rankNo(rank)
                    .roomId(room.getRoomId())
                    .buildingNm(room.getBuilding() != null ? room.getBuilding().getBuildingNm() : null)
                    .buildingAddr(room.getBuilding() != null ? room.getBuilding().getBuildingAddr() : null)
                    .roomType(room.getRoomType())
                    .rentPrice(room.getRentPrice())
                    .floor(room.getFloor())
                    .aiReason(reason)
                    .avgRating(toBigDecimal(stat.get("avg_rating")))
                    .reviewCount(toInt(stat.get("review_count")))
                    .contractCount(toInt(stat.get("contract_count")))
                    .thumbnailUrl(fetchThumbnailUrl(room.getRoomId()))
                    .generatedAt(now)
                    .build());
        }

        log.info("[RoomRecommendation] 개인화 추천 완료: {}건", responses.size());
        return responses;
    }

    // ──────────────────────────────────────────
    // DB 저장 공통 메서드
    // ──────────────────────────────────────────
    private void saveRecommendations(
            List<Map<String, Object>> recommendations,
            List<Map<String, Object>> stats
    ) {
        LocalDateTime now = LocalDateTime.now();
        List<AiRoomRecommendation> toSave = new ArrayList<>();

        for (Map<String, Object> rec : recommendations) {
            int roomId = toInt(rec.get("room_id"));
            int rank   = toInt(rec.get("rank"));
            String reason = String.valueOf(rec.getOrDefault("reason", ""));

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
    // Native Query: 방별 통계 집계
    //
    // ✅ 기존 대비 추가 필드:
    //   building_addr, sun_direction, pet_allowed_yn,
    //   manage_fee, deposit, rent_min, room_options, room_desc
    //   → Python room_recommend.py 가 개인화 추천에 활용
    // ──────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchRoomStats() {
        String sql = """
            SELECT
                r.room_id          AS room_id,
                b.building_nm      AS building_nm,
                b.building_addr    AS building_addr,
                r.room_type        AS room_type,
                r.floor            AS floor,
                r.room_size        AS room_size,
                r.rent_price       AS rent_price,
                r.manage_fee       AS manage_fee,
                r.deposit          AS deposit,
                r.rent_min         AS rent_min,
                r.sun_direction    AS sun_direction,
                r.pet_allowed_yn   AS pet_allowed_yn,
                r.room_options     AS room_options,
                r.room_desc        AS room_desc,
                r.room_capacity    AS room_capacity,
                COALESCE(AVG(rv.rating), 0)      AS avg_rating,
                COUNT(DISTINCT rv.review_id)     AS review_count,
                COUNT(DISTINCT c.contract_id)    AS contract_count
            FROM rooms r
            INNER JOIN building b ON b.building_id = r.building_id
            LEFT  JOIN reviews rv ON rv.room_id = r.room_id
            LEFT  JOIN contract c ON c.room_id  = r.room_id
                                 AND c.contract_st = 'active'
            WHERE r.delete_yn = 'N'
              AND b.delete_yn = 'N'
              AND r.room_st   = 'available'
            GROUP BY
                r.room_id, b.building_nm, b.building_addr,
                r.room_type, r.floor, r.room_size,
                r.rent_price, r.manage_fee, r.deposit, r.rent_min,
                r.sun_direction, r.pet_allowed_yn,
                r.room_options, r.room_desc, r.room_capacity
            ORDER BY avg_rating DESC, review_count DESC
            LIMIT 20
            """;

        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rows) {
            result.add(Map.ofEntries(
                    Map.entry("room_id",        row[0]),
                    Map.entry("building_nm",    row[1]  != null ? row[1]  : ""),
                    Map.entry("building_addr",  row[2]  != null ? row[2]  : ""),
                    Map.entry("room_type",      row[3]  != null ? row[3]  : ""),
                    Map.entry("floor",          row[4]  != null ? row[4]  : 0),
                    Map.entry("room_size",      row[5]  != null ? ((BigDecimal) row[5]).doubleValue() : 0.0),
                    Map.entry("rent_price",     row[6]  != null ? ((BigDecimal) row[6]).intValue() : 0),
                    Map.entry("manage_fee",     row[7]  != null ? ((BigDecimal) row[7]).intValue() : 0),
                    Map.entry("deposit",        row[8]  != null ? ((BigDecimal) row[8]).intValue() : 0),
                    Map.entry("rent_min",       row[9]  != null ? row[9]  : 0),
                    Map.entry("sun_direction",  row[10] != null ? row[10] : ""),
                    Map.entry("pet_allowed_yn", row[11] != null ? row[11] : "N"),
                    Map.entry("room_options",   row[12] != null ? row[12] : ""),
                    Map.entry("room_desc",      row[13] != null ? row[13] : ""),
                    Map.entry("room_capacity",  row[14] != null ? row[14] : 1),
                    Map.entry("avg_rating",     row[15] != null ? ((Number) row[15]).doubleValue() : 0.0),
                    Map.entry("review_count",   row[16] != null ? ((Number) row[16]).intValue() : 0),
                    Map.entry("contract_count", row[17] != null ? ((Number) row[17]).intValue() : 0)
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