package org.myweb.uniplace.domain.inspection.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.inspection.domain.entity.MaintenanceTicket;

import java.time.LocalDateTime;

@Getter
@Builder
public class MaintenanceTicketResponse {

    private Integer   ticketId;
    private Integer   inspectionId;
    private String    spaceType;
    private Integer   spaceId;
    private String    issueType;     // 문제 유형 (wall_crack 등)
    private String    severity;      // 심각도 (low/medium/high/critical)
    private String    description;   // AI 설명
    private String    ticketStatus;  // 처리 상태
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MaintenanceTicketResponse from(MaintenanceTicket ticket) {
        return MaintenanceTicketResponse.builder()
                .ticketId(ticket.getTicketId())
                .inspectionId(ticket.getInspectionId())
                .spaceType(ticket.getSpaceType().name())
                .spaceId(ticket.getSpaceId())
                .issueType(ticket.getIssueType())
                .severity(ticket.getSeverity().name())
                .description(ticket.getDescription())
                .ticketStatus(ticket.getTicketStatus().name())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
