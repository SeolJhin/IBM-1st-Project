package org.myweb.uniplace.domain.contract.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminContractSummaryResponse {

    private Integer contractId;

    private String rentType;               // monthly_rent / stay
    private BigDecimal rentPrice;

    private Integer buildingId;
    private String buildingNm;

    private Integer roomId;
    private Integer roomNo;

    private LocalDate contractStart;
    private LocalDate contractEnd;

    private String lessorNm;             // 임대인(회원 입력)
    private String tenantUserId;           // 임차인(계약 신청자 userId)

    private ContractStatus contractStatus;

    // 계약서 파일 표시 (파일명 + 다운로드 URL)
    private Integer contractPdfFileId;
    private String contractPdfFileName;
    private String contractPdfUrl;

    public static AdminContractSummaryResponse fromEntity(
            Contract c,
            String pdfFileName
    ) {
        Room r = c.getRoom();
        Building b = (r != null ? r.getBuilding() : null);

        Integer pdfId = c.getContractPdfFileId();
        String pdfUrl = (pdfId != null) ? ("/files/" + pdfId + "/download") : null;

        return AdminContractSummaryResponse.builder()
                .contractId(c.getContractId())

                .rentType(c.getRentType() != null ? c.getRentType().name() : null)
                .rentPrice(c.getRentPrice())

                .buildingId(b != null ? b.getBuildingId() : null)
                .buildingNm(b != null ? b.getBuildingNm() : null)

                .roomId(r != null ? r.getRoomId() : null)
                .roomNo(r != null ? r.getRoomNo() : null)

                .contractStart(c.getContractStart())
                .contractEnd(c.getContractEnd())

                .lessorNm(c.getLessorNm())
                .tenantUserId(c.getUser() != null ? c.getUser().getUserId() : null)

                .contractStatus(c.getContractSt())

                .contractPdfFileId(pdfId)
                .contractPdfFileName(pdfFileName)
                .contractPdfUrl(pdfUrl)
                .build();
    }
}