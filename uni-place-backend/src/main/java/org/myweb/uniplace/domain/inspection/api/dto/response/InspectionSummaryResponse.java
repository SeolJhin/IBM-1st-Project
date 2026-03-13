package org.myweb.uniplace.domain.inspection.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.inspection.domain.entity.Inspection;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 목록용 요약 응답 (이미지 데이터 등 무거운 정보 제외) */
@Getter
@Builder
public class InspectionSummaryResponse {

    private Integer     inspectionId;
    private String      spaceType;
    private Integer     spaceId;
    private String      inspectorId;
    private BigDecimal  changePercent;
    private String      inspectionStatus;
    private LocalDateTime createdAt;

    public static InspectionSummaryResponse from(Inspection inspection) {
        return InspectionSummaryResponse.builder()
                .inspectionId(inspection.getInspectionId())
                .spaceType(inspection.getSpaceType().name())
                .spaceId(inspection.getSpaceId())
                .inspectorId(inspection.getInspectorId())
                .changePercent(inspection.getChangePercent())
                .inspectionStatus(inspection.getInspectionStatus().name())
                .createdAt(inspection.getCreatedAt())
                .build();
    }
}
