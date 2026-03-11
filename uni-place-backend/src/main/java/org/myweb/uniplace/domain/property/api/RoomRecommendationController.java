// 경로: org/myweb/uniplace/domain/property/api/RoomRecommendationController.java
package org.myweb.uniplace.domain.property.api;

import java.util.List;

import org.myweb.uniplace.domain.property.api.dto.response.RoomRecommendationResponse;
import org.myweb.uniplace.domain.property.application.RoomRecommendationService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

/**
 * AI 방 추천 Top3 REST 컨트롤러
 *
 * GET  /rooms/recommendations          - 공개: 홈 화면에서 최신 Top3 조회
 * POST /admin/rooms/recommendations/refresh - 관리자: 수동 갱신 트리거
 */
@RestController
@RequiredArgsConstructor
public class RoomRecommendationController {

    private final RoomRecommendationService recommendationService;

    /**
     * 공개 API - 최신 AI 추천 Top3 조회
     * GET /rooms/recommendations
     */
    @GetMapping("/rooms/recommendations")
    public ApiResponse<List<RoomRecommendationResponse>> getRecommendations() {
        return ApiResponse.ok(recommendationService.getLatestTop3());
    }

    /**
     * 관리자 API - 수동 갱신 (AI 재호출 + DB 업데이트)
     * POST /admin/rooms/recommendations/refresh
     */
    @PostMapping("/admin/rooms/recommendations/refresh")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> refresh() {
        recommendationService.refreshNow();
        return ApiResponse.ok();
    }
}
