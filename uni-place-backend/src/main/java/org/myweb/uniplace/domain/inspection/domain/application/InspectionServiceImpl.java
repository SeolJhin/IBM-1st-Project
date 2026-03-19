package org.myweb.uniplace.domain.inspection.domain.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.inspection.api.dto.request.InspectionCreateRequest;
import org.myweb.uniplace.domain.inspection.api.dto.response.InspectionDetailResponse;
import org.myweb.uniplace.domain.inspection.api.dto.response.InspectionSummaryResponse;
import org.myweb.uniplace.domain.inspection.api.dto.response.MaintenanceTicketResponse;
import org.myweb.uniplace.domain.inspection.domain.entity.Inspection;
import org.myweb.uniplace.domain.inspection.domain.entity.MaintenanceTicket;
import org.myweb.uniplace.domain.inspection.domain.enums.InspectionSpaceType;
import org.myweb.uniplace.domain.inspection.domain.enums.InspectionStatus;
import org.myweb.uniplace.domain.inspection.domain.enums.IssueSeverity;
import org.myweb.uniplace.domain.inspection.domain.enums.TicketStatus;
import org.myweb.uniplace.domain.inspection.domain.infrastructure.InspectionAiClient;
import org.myweb.uniplace.domain.inspection.domain.infrastructure.InspectionAiClient.InspectionAiResult;
import org.myweb.uniplace.domain.inspection.domain.repository.InspectionRepository;
import org.myweb.uniplace.domain.inspection.domain.repository.MaintenanceTicketRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.storage.StorageService;
import org.myweb.uniplace.domain.inspection.api.dto.response.InspectionDetailResponse;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.util.CustomMultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;



import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InspectionServiceImpl implements InspectionService {

    private final InspectionRepository inspectionRepository;
    private final MaintenanceTicketRepository ticketRepository;
    private final FileService fileService;
    private final InspectionAiClient aiClient;
    private final StorageService storageService;


    private static final String FILE_PARENT_TYPE = "INSPECTION";
    private static final int    TEMP_PARENT_ID   = 0;

    @Override
    public InspectionDetailResponse createInspection(
            InspectionCreateRequest request,
            MultipartFile afterImage,
            String inspectorId
    ) {
        InspectionSpaceType spaceType = InspectionSpaceType.valueOf(request.getSpaceType());

        // ── 1. after 이미지 저장 ────────────────────────────────────────────
        FileUploadRequest afterUploadReq = FileUploadRequest.builder()
                .fileParentType(FILE_PARENT_TYPE)
                .fileParentId(TEMP_PARENT_ID)
                .files(List.of(afterImage))
                .build();
        FileResponse afterFileResp = fileService.uploadFiles(afterUploadReq).getFiles().get(0);
        Integer afterFileId = afterFileResp.getFileId();
        log.info("[INSPECTION] after 이미지 저장 완료 - fileId={}", afterFileId);

        // ── 2. 이전 점검 조회 (before 이미지 가져오기) ─────────────────────
        Optional<Inspection> prevOpt = inspectionRepository
                .findTopBySpaceTypeAndSpaceIdOrderByCreatedAtDesc(spaceType, request.getSpaceId());

        Integer beforeFileId    = null;
        String  beforeImageB64  = null;

        if (prevOpt.isPresent()) {
            beforeFileId   = prevOpt.get().getAfterFileId();
            beforeImageB64 = readFileAsBase64(beforeFileId);
            log.info("[INSPECTION] 이전 점검 존재 - beforeFileId={}", beforeFileId);
        } else {
            log.info("[INSPECTION] 첫 번째 점검 → before 이미지 없음");
        }

        // ── 3. after 이미지 base64 변환 ─────────────────────────────────────
        String afterImageB64 = readFileAsBase64(afterFileId);

        // ── 4. Python AI 서버 호출 ─────────────────────────────────────────
        InspectionAiResult aiResult = aiClient.compare(
                beforeImageB64, afterImageB64,
                spaceType.name(), request.getSpaceId()
        );

        // ── 5. diff 이미지 저장 ─────────────────────────────────────────────
        Integer diffFileId = null;
        if (aiResult.diffImageB64() != null) {
            diffFileId = saveDiffImage(aiResult.diffImageB64(), TEMP_PARENT_ID);
            log.info("[INSPECTION] diff 이미지 저장 완료 - fileId={}", diffFileId);
        }

        // ── 6. 점검 상태 결정 ───────────────────────────────────────────────
        InspectionStatus status;
        if (aiResult.isFirstInspection()) {
            status = InspectionStatus.completed;
        } else if (!aiResult.hasSignificantChange()) {
            status = InspectionStatus.no_change;
        } else if (!aiResult.detectedIssues().isEmpty()) {
            status = InspectionStatus.issue_detected;
        } else {
            status = InspectionStatus.completed;
        }

        // ── 7. Inspection 레코드 저장 ────────────────────────────────────────
        Inspection inspection = Inspection.builder()
                .spaceType(spaceType)
                .spaceId(request.getSpaceId())
                .inspectorId(inspectorId)
                .beforeFileId(beforeFileId)
                .afterFileId(afterFileId)
                .diffFileId(diffFileId)
                .changePercent(BigDecimal.valueOf(aiResult.changePercent()))
                .inspectionStatus(status)
                .inspectionMemo(request.getInspectionMemo())
                .build();

        Inspection saved = inspectionRepository.save(inspection);

        // ── 8. 유지보수 티켓 자동 생성 ──────────────────────────────────────
        List<MaintenanceTicket> tickets = aiResult.detectedIssues().stream()
                .map(issue -> MaintenanceTicket.builder()
                        .inspectionId(saved.getInspectionId())
                        .spaceType(spaceType)
                        .spaceId(request.getSpaceId())
                        .issueType(issue.issueType())
                        .severity(IssueSeverity.valueOf(issue.severity()))
                        .description(issue.description())
                        .ticketStatus(TicketStatus.open)
                        .build())
                .toList();

        if (!tickets.isEmpty()) {
            ticketRepository.saveAll(tickets);
            log.info("[INSPECTION] 티켓 {}개 자동 생성", tickets.size());
        }

        return buildDetailResponse(saved, tickets, aiResult.aiSummary());
    }

    @Override
    @Transactional(readOnly = true)
    public InspectionDetailResponse getInspection(Integer inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INSPECTION_NOT_FOUND));
        List<MaintenanceTicket> tickets = ticketRepository.findByInspectionId(inspectionId);
        return buildDetailResponse(inspection, tickets, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InspectionSummaryResponse> getInspectionsBySpace(
            String spaceType, Integer spaceId, Pageable pageable
    ) {
        InspectionSpaceType type = InspectionSpaceType.valueOf(spaceType);
        return inspectionRepository
                .findBySpaceTypeAndSpaceIdOrderByCreatedAtDesc(type, spaceId, pageable)
                .map(InspectionSummaryResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InspectionSummaryResponse> getAllInspections(Pageable pageable) {
        return inspectionRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(InspectionSummaryResponse::from);
    }

    @Override
    public MaintenanceTicketResponse updateTicketStatus(Integer ticketId, TicketStatus newStatus) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TICKET_NOT_FOUND));
        ticket.setTicketStatus(newStatus);
        MaintenanceTicket saved = ticketRepository.save(ticket);

        // ── 모든 티켓이 closed면 점검 상태를 completed로 자동 변경 ──────────
        if (newStatus == TicketStatus.closed) {
            List<MaintenanceTicket> allTickets = ticketRepository.findByInspectionId(ticket.getInspectionId());
            boolean allClosed = allTickets.stream()
                    .allMatch(t -> t.getTicketStatus() == TicketStatus.closed);
            if (allClosed) {
                inspectionRepository.findById(ticket.getInspectionId()).ifPresent(inspection -> {
                    inspection.setInspectionStatus(InspectionStatus.completed);
                    inspectionRepository.save(inspection);
                    log.info("[INSPECTION] 모든 티켓 종료 → 점검 상태 completed 자동 변경 - inspectionId={}",
                            ticket.getInspectionId());
                });
            }
        }

        return MaintenanceTicketResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MaintenanceTicketResponse> getOpenTickets(Pageable pageable) {
        // closed(종료)를 제외한 전체 티켓 반환 (open + in_progress + resolved)
        return ticketRepository
                .findByTicketStatusNotOrderByCreatedAtDesc(TicketStatus.closed, pageable)
                .map(MaintenanceTicketResponse::from);
    }

    @Override
    public void deleteInspection(Integer inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INSPECTION_NOT_FOUND));

        // ── 1. 연관 티켓 먼저 삭제 ──────────────────────────────────────────
        List<MaintenanceTicket> tickets = ticketRepository.findByInspectionId(inspectionId);
        if (!tickets.isEmpty()) {
            ticketRepository.deleteAll(tickets);
            log.info("[INSPECTION] 연관 티켓 {}개 삭제 - inspectionId={}", tickets.size(), inspectionId);
        }

        // ── 2. 파일 소프트 삭제 (after + diff만, before는 이전 점검 파일이라 삭제 X) ──
        List<Integer> fileIdsToDelete = new java.util.ArrayList<>();
        if (inspection.getAfterFileId() != null) fileIdsToDelete.add(inspection.getAfterFileId());
        if (inspection.getDiffFileId()  != null) fileIdsToDelete.add(inspection.getDiffFileId());
        if (!fileIdsToDelete.isEmpty()) {
            fileService.softDeleteFiles(fileIdsToDelete);
            log.info("[INSPECTION] 파일 {}개 소프트 삭제 - fileIds={}", fileIdsToDelete.size(), fileIdsToDelete);
        }

        // ── 3. 점검 레코드 삭제 ──────────────────────────────────────────────
        inspectionRepository.delete(inspection);
        log.info("[INSPECTION] 점검 삭제 완료 - inspectionId={}", inspectionId);
    }

    // ── private 헬퍼 ────────────────────────────────────────────────────────

    /** 파일 ID → base64 문자열 변환 (Spring Boot → Python 전송용) */
    private String readFileAsBase64(Integer fileId) {
        try {
            FileResponse meta = fileService.getFile(fileId);
            byte[] bytes = storageService.read(meta.getFilePath(), meta.getRenameFilename()).readAllBytes();
            return Base64.getEncoder().encodeToString(bytes);
        } catch (IOException e) {
            log.error("[INSPECTION] 파일 읽기 실패 - fileId={}: {}", fileId, e.getMessage());
            throw new RuntimeException("이미지 파일을 읽을 수 없습니다: fileId=" + fileId, e);
        }
    }

    /** Python이 반환한 base64 diff 이미지를 파일로 저장 */
    private Integer saveDiffImage(String diffImageB64, Integer parentId) {
        try {
            byte[] imageBytes = Base64.getDecoder().decode(diffImageB64);
            MultipartFile multipartFile = new CustomMultipartFile(
                    imageBytes,
                    "diff_" + System.currentTimeMillis() + ".png",
                    "image/png"
            );
            FileUploadRequest req = FileUploadRequest.builder()
                    .fileParentType(FILE_PARENT_TYPE)
                    .fileParentId(parentId)
                    .files(List.of(multipartFile))
                    .build();
            return fileService.uploadFiles(req).getFiles().get(0).getFileId();
        } catch (Exception e) {
            log.error("[INSPECTION] diff 이미지 저장 실패: {}", e.getMessage());
            return null; // diff 저장 실패해도 점검 기록은 저장됨
        }
    }

    private InspectionDetailResponse buildDetailResponse(
            Inspection inspection,
            List<MaintenanceTicket> tickets,
            String aiSummary
    ) {
        List<MaintenanceTicketResponse> ticketResponses = tickets.stream()
                .map(MaintenanceTicketResponse::from)
                .toList();
        return InspectionDetailResponse.from(inspection, ticketResponses, aiSummary, fileService);
    }
}