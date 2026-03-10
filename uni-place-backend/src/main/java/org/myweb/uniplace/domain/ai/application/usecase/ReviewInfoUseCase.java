package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.review.api.dto.response.ReviewResponse;
import org.myweb.uniplace.domain.review.application.ReviewService;
import org.myweb.uniplace.domain.review.repository.ReviewRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ReviewInfoUseCase extends AbstractForwardUseCase {

    private final ReviewService    reviewService;
    private final ReviewRepository reviewRepository;

    public ReviewInfoUseCase(AiGateway aiGateway,
                             ReviewService reviewService,
                             ReviewRepository reviewRepository) {
        super(aiGateway);
        this.reviewService    = reviewService;
        this.reviewRepository = reviewRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) slots.putAll(request.getSlots());

        slots.put("items", fetchReviewItems(slots));

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent())
            .userId(request.getUserId())
            .userSegment(request.getUserSegment())
            .prompt(request.getPrompt())
            .slots(slots)
            .build());
    }

    @Override
    protected AiIntent getIntent() { return AiIntent.REVIEW_INFO; }

    private List<Map<String, Object>> fetchReviewItems(Map<String, Object> slots) {
        // ── 정렬 ──────────────────────────────────────────────────────
        String sortBy    = strSlot(slots, "sort_by");
        String sortOrder = strSlot(slots, "sort_order");
        int    limit     = intSlot(slots, "limit", 10);

        Sort sort = buildSort(sortBy, sortOrder);
        PageRequest pageable = PageRequest.of(0, limit, sort);

        // ── 필터 조건 ─────────────────────────────────────────────────
        Integer roomId     = intObjSlot(slots, "room_id", "roomId");
        Integer minRating  = intObjSlot(slots, "min_rating", "minRating");
        Integer maxRating  = intObjSlot(slots, "max_rating", "maxRating");
        String  buildingNm = strSlot(slots, "building_nm", "buildingNm");

        // 단순 roomId 조회(필터/정렬 없음) → 기존 서비스 활용
        boolean hasFilter = roomId != null || minRating != null || maxRating != null
                            || (buildingNm != null && !buildingNm.isBlank());

        List<ReviewResponse> reviews;
        if (hasFilter || sortBy != null) {
            reviews = reviewRepository.searchWithFilters(roomId, minRating, maxRating,
                            buildingNm, pageable)
                        .stream()
                        .map(e -> ReviewResponse.fromEntity(e, null))
                        .toList();
        } else if (roomId != null) {
            reviews = reviewService.getReviewListByRoom(roomId, pageable).content();
        } else {
            reviews = reviewService.getAllReviews(pageable).content();
        }

        return reviews.stream().map(r -> {
            Map<String, Object> item = new HashMap<>();
            item.put("review_id",   r.getReviewId());
            item.put("building_nm", r.getBuildingNm());
            item.put("room_no",     r.getRoomNo());
            item.put("room_id",     r.getRoomId());
            item.put("rating",      r.getRating());
            item.put("title",       r.getReviewTitle());
            item.put("content",     r.getReviewCtnt());
            item.put("read_count",  r.getReadCount());
            item.put("like_count",  r.getLikeCount());
            item.put("created_at",  r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
            return item;
        }).toList();
    }

    // ── 정렬 컬럼 매핑 ────────────────────────────────────────────────
    private Sort buildSort(String sortBy, String sortOrder) {
        boolean asc = "asc".equalsIgnoreCase(sortOrder);
        String col = switch (sortBy == null ? "" : sortBy.toLowerCase()) {
            case "rating"      -> "rating";
            case "read_count"  -> "readCount";
            case "like_count"  -> "likeCount";
            case "created_at"  -> "createdAt";
            default            -> "reviewId";      // 기본: 최신순
        };
        return asc ? Sort.by(Sort.Direction.ASC, col)
                   : Sort.by(Sort.Direction.DESC, col);
    }

    // ── slot 헬퍼 ─────────────────────────────────────────────────────
    private String strSlot(Map<String, Object> slots, String... keys) {
        for (String k : keys) {
            Object v = slots.get(k);
            if (v != null) { String s = v.toString().trim(); if (!s.isEmpty()) return s; }
        }
        return null;
    }

    private Integer intObjSlot(Map<String, Object> slots, String... keys) {
        for (String k : keys) {
            Object v = slots.get(k);
            if (v == null) continue;
            if (v instanceof Number n) return n.intValue();
            try { return Integer.parseInt(v.toString().trim()); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private int intSlot(Map<String, Object> slots, String key, int defaultVal) {
        Integer v = intObjSlot(slots, key);
        return v != null ? v : defaultVal;
    }
}