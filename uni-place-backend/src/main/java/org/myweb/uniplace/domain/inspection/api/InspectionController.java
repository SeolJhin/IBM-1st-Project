package org.myweb.uniplace.domain.inspection.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.inspection.api.dto.request.InspectionCreateRequest;
import org.myweb.uniplace.domain.inspection.api.dto.request.TicketStatusUpdateRequest;
import org.myweb.uniplace.domain.inspection.api.dto.response.InspectionDetailResponse;
import org.myweb.uniplace.domain.inspection.api.dto.response.InspectionSummaryResponse;
import org.myweb.uniplace.domain.inspection.api.dto.response.MaintenanceTicketResponse;
import org.myweb.uniplace.domain.inspection.domain.application.InspectionService;
import org.myweb.uniplace.domain.inspection.domain.enums.TicketStatus;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/inspections")
@PreAuthorize("hasRole('ADMIN')")
public class InspectionController {

    private final InspectionService inspectionService;

    /**
     * POST /admin/inspections
     * 새로운 점검 생성 (이미지 업로드 + AI 분석)
     *
     * 요청: multipart/form-data
     *   - afterImage    : 이번 점검 이미지 파일 (필수)
     *   - spaceType     : room / building / common_space
     *   - spaceId       : 공간 ID
     *   - inspectionMemo: 점검 메모 (선택)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<InspectionDetailResponse>> createInspection(
            @RequestPart("afterImage") MultipartFile afterImage,
            @Valid @ModelAttribute InspectionCreateRequest request,
            @AuthenticationPrincipal AuthUser authUser
    ) {
        InspectionDetailResponse response = inspectionService.createInspection(
                request, afterImage, authUser.getUserId()
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /admin/inspections/{inspectionId}
     * 점검 상세 조회
     */
    @GetMapping("/{inspectionId}")
    public ResponseEntity<ApiResponse<InspectionDetailResponse>> getInspection(
            @PathVariable("inspectionId") Integer inspectionId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(inspectionService.getInspection(inspectionId)));
    }

    /**
     * GET /admin/inspections?page=0&size=10
     * 전체 점검 목록 조회 (최신순)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<InspectionSummaryResponse>>> getAllInspections(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(inspectionService.getAllInspections(pageable))));
    }

    /**
     * GET /admin/inspections/spaces/{spaceType}/{spaceId}
     * 특정 공간의 점검 목록 조회
     * 예시: /admin/inspections/spaces/room/101
     */
    @GetMapping("/spaces/{spaceType}/{spaceId}")
    public ResponseEntity<ApiResponse<PageResponse<InspectionSummaryResponse>>> getBySpace(
            @PathVariable("spaceType") String spaceType,
            @PathVariable("spaceId") Integer spaceId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var result = inspectionService.getInspectionsBySpace(spaceType, spaceId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(result)));
    }

    /**
     * GET /admin/inspections/tickets/open
     * 미처리(open) 티켓 목록 조회
     */
    @GetMapping("/tickets/open")
    public ResponseEntity<ApiResponse<PageResponse<MaintenanceTicketResponse>>> getOpenTickets(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(inspectionService.getOpenTickets(pageable))));
    }

    /**
     * PATCH /admin/inspections/tickets/{ticketId}/status
     * 티켓 처리 상태 변경
     * 요청 예시: { "ticketStatus": "in_progress" }
     */
    @PatchMapping("/tickets/{ticketId}/status")
    public ResponseEntity<ApiResponse<MaintenanceTicketResponse>> updateTicketStatus(
            @PathVariable("ticketId") Integer ticketId,
            @Valid @RequestBody TicketStatusUpdateRequest request
    ) {
        TicketStatus newStatus = TicketStatus.valueOf(request.getTicketStatus());
        return ResponseEntity.ok(ApiResponse.ok(inspectionService.updateTicketStatus(ticketId, newStatus)));
    }

    /**
     * DELETE /admin/inspections/{inspectionId}
     * 점검 삭제 (연관 티켓 포함)
     */
    @DeleteMapping("/{inspectionId}")
    public ResponseEntity<ApiResponse<Void>> deleteInspection(
            @PathVariable("inspectionId") Integer inspectionId
    ) {
        inspectionService.deleteInspection(inspectionId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}