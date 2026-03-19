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
 * GET  /rooms/recommendations               - 공개: 홈 화면에서 최신 Top3 조회
 *      ?userQuery=조용한 남향 원룸          - (선택) 자연어 쿼리 → 실시간 AI 개인화 추천
 *
 * POST /admin/rooms/recommendations/refresh - 관리자: 수동 갱신 트리거
 */
@RestController
@RequiredArgsConstructor
public class RoomRecommendationController {

    private final RoomRecommendationService recommendationService;

    /**
     * 공개 API - AI 추천 Top3 조회
     *
     * @param userQuery 선택 파라미터. 없으면 DB 캐시(최신 배치 결과) 반환.
     *                  있으면 AI를 실시간 호출하여 개인화 추천 반환.
     *
     * GET /rooms/recommendations
     * GET /rooms/recommendations?userQuery=조용한 남향 원룸, 50만원 이하
     */
    @GetMapping("/rooms/recommendations")
    public ApiResponse<List<RoomRecommendationResponse>> getRecommendations(
            @RequestParam(name = "userQuery", required = false) String userQuery
    ) {
        return ApiResponse.ok(recommendationService.getLatestTop3(userQuery));
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