package org.myweb.uniplace.domain.system.api.admin;

import java.util.List;

import org.myweb.uniplace.domain.system.api.dto.request.BannerCreateRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerOrderRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.domain.system.application.BannerService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/banners")
public class AdminBannerController {

    private final BannerService bannerService;

    // 전체 배너 목록(관리용)
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<BannerResponse>>> bannerList(
            @PageableDefault(size = 10, sort = "banId", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(bannerService.bannerList(pageable)));
    }

    // 배너 등록
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Void>> createBanner(
            @ModelAttribute BannerCreateRequest request,
            @RequestParam(name = "file", required = false) MultipartFile file
    ) {
        bannerService.createBanner(request, file);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 배너 삭제
    @DeleteMapping("/{banId}")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable("banId") int banId) {
        bannerService.deleteBanner(banId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 배너 수정
    @PutMapping(value = "/{banId}", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Void>> updateBanner(
            @PathVariable("banId") int banId,
            @ModelAttribute BannerUpdateRequest request,
            @RequestParam(name = "deleteFlag", defaultValue = "false") boolean deleteFlag,
            @RequestParam(name = "file", required = false) MultipartFile file
    ) {
    	log.info("startAt={}, endAt={}, title={}, order={}, url={}",
    	        request.getStartAt(), request.getEndAt(),
    	        request.getBanTitle(), request.getBanOrder(), request.getBanUrl());
        bannerService.updateBanner(banId, request, deleteFlag, file);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 배너 상태 변경
    @PatchMapping("/{banId}/status")
    public ResponseEntity<ApiResponse<Void>> updateBannerStatus(
            @PathVariable("banId") int banId,
            @RequestParam(name = "status") String status
    ) {
        bannerService.updateBannerStatus(banId, status);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 배너 순서 변경
    @PatchMapping("/order")
    public ResponseEntity<ApiResponse<Void>> updateOrder(@RequestBody List<BannerOrderRequest> orders) {
        bannerService.updateOrder(orders);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}