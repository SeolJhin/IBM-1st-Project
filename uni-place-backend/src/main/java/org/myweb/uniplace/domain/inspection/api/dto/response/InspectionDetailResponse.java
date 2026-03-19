package org.myweb.uniplace.domain.inspection.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.inspection.domain.entity.Inspection;
import org.myweb.uniplace.global.storage.StorageService;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class InspectionDetailResponse {

    private Integer     inspectionId;
    private String      spaceType;
    private Integer     spaceId;
    private String      inspectorId;

    private Integer     beforeFileId;
    private String      beforeFileViewUrl;   // 환경에 맞는 이미지 URL

    private Integer     afterFileId;
    private String      afterFileViewUrl;    // 환경에 맞는 이미지 URL

    private Integer     diffFileId;
    private String      diffFileViewUrl;     // 환경에 맞는 이미지 URL

    private BigDecimal  changePercent;
    private String      inspectionStatus;
    private String      inspectionMemo;
    private String      aiSummary;
    private List<MaintenanceTicketResponse> tickets;
    private LocalDateTime createdAt;

    /**
     * FileService 를 받아 각 fileId → viewUrl 변환
     */
    public static InspectionDetailResponse from(
            Inspection inspection,
            List<MaintenanceTicketResponse> tickets,
            String aiSummary,
            FileService fileService
    ) {
        String beforeViewUrl = resolveUrl(inspection.getBeforeFileId(), fileService);
        String afterViewUrl  = resolveUrl(inspection.getAfterFileId(),  fileService);
        String diffViewUrl   = resolveUrl(inspection.getDiffFileId(),   fileService);

        return InspectionDetailResponse.builder()
                .inspectionId(inspection.getInspectionId())
                .spaceType(inspection.getSpaceType().name())
                .spaceId(inspection.getSpaceId())
                .inspectorId(inspection.getInspectorId())
                .beforeFileId(inspection.getBeforeFileId())
                .beforeFileViewUrl(beforeViewUrl)
                .afterFileId(inspection.getAfterFileId())
                .afterFileViewUrl(afterViewUrl)
                .diffFileId(inspection.getDiffFileId())
                .diffFileViewUrl(diffViewUrl)
                .changePercent(inspection.getChangePercent())
                .inspectionStatus(inspection.getInspectionStatus().name())
                .inspectionMemo(inspection.getInspectionMemo())
                .aiSummary(aiSummary)
                .tickets(tickets)
                .createdAt(inspection.getCreatedAt())
                .build();
    }

    /** 하위 호환: FileService 없이 호출 시 */
    public static InspectionDetailResponse from(
            Inspection inspection,
            List<MaintenanceTicketResponse> tickets,
            String aiSummary
    ) {
        return from(inspection, tickets, aiSummary, null);
    }

    private static String resolveUrl(Integer fileId, FileService fileService) {
        if (fileId == null || fileService == null) return null;
        try {
            FileResponse fr = fileService.getFile(fileId);
            return fr.getViewUrl();
        } catch (Exception e) {
            return null;
        }
    }
}