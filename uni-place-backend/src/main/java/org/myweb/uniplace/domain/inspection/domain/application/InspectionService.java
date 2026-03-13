package org.myweb.uniplace.domain.inspection.domain.application;

import org.myweb.uniplace.domain.inspection.api.dto.request.InspectionCreateRequest;
import org.myweb.uniplace.domain.inspection.api.dto.response.InspectionDetailResponse;
import org.myweb.uniplace.domain.inspection.api.dto.response.InspectionSummaryResponse;
import org.myweb.uniplace.domain.inspection.api.dto.response.MaintenanceTicketResponse;
import org.myweb.uniplace.domain.inspection.domain.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface InspectionService {

    /** 점검 이미지 업로드 + AI 분석 + 결과 저장 */
    InspectionDetailResponse createInspection(
            InspectionCreateRequest request,
            MultipartFile afterImage,
            String inspectorId
    );

    /** 점검 상세 조회 */
    InspectionDetailResponse getInspection(Integer inspectionId);

    /** 특정 공간의 점검 목록 조회 (페이징) */
    Page<InspectionSummaryResponse> getInspectionsBySpace(
            String spaceType, Integer spaceId, Pageable pageable
    );

    /** 전체 점검 목록 조회 (관리자용, 페이징) */
    Page<InspectionSummaryResponse> getAllInspections(Pageable pageable);

    /** 티켓 상태 변경 */
    MaintenanceTicketResponse updateTicketStatus(Integer ticketId, TicketStatus newStatus);

    /** 미처리(open) 티켓 목록 조회 */
    Page<MaintenanceTicketResponse> getOpenTickets(Pageable pageable);

    /** 점검 삭제 (연관 티켓 포함) */
    void deleteInspection(Integer inspectionId);
}