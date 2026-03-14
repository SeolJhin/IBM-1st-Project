package org.myweb.uniplace.domain.inspection.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.inspection.domain.entity.Inspection;

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
    private Integer     beforeFileId;    // 이전 점검 이미지 file_id
    private Integer     afterFileId;     // 이번 점검 이미지 file_id
    private Integer     diffFileId;      // diff 이미지 file_id (null 가능)
    private BigDecimal  changePercent;
    private String      inspectionStatus;
    private String      inspectionMemo;
    private String      aiSummary;       // AI 종합 요약
    private List<MaintenanceTicketResponse> tickets;
    private LocalDateTime createdAt;

    public static InspectionDetailResponse from(
            Inspection inspection,
            List<MaintenanceTicketResponse> tickets,
            String aiSummary
    ) {
        return InspectionDetailResponse.builder()
                .inspectionId(inspection.getInspectionId())
                .spaceType(inspection.getSpaceType().name())
                .spaceId(inspection.getSpaceId())
                .inspectorId(inspection.getInspectorId())
                .beforeFileId(inspection.getBeforeFileId())
                .afterFileId(inspection.getAfterFileId())
                .diffFileId(inspection.getDiffFileId())
                .changePercent(inspection.getChangePercent())
                .inspectionStatus(inspection.getInspectionStatus().name())
                .inspectionMemo(inspection.getInspectionMemo())
                .aiSummary(aiSummary)
                .tickets(tickets)
                .createdAt(inspection.getCreatedAt())
                .build();
    }
}
