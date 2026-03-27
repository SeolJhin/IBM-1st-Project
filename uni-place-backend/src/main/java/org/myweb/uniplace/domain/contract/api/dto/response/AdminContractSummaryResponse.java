package org.myweb.uniplace.domain.contract.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.global.storage.StorageService;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminContractSummaryResponse {

    private Integer contractId;
    private String rentType;
    private BigDecimal rentPrice;
    private Integer buildingId;
    private String buildingNm;
    private Integer roomId;
    private Integer roomNo;
    private LocalDate contractStart;
    private LocalDate contractEnd;
    private String lessorNm;
    private String tenantUserId;
    private String tenantNm;
    private ContractStatus contractStatus;
    private Integer contractPdfFileId;
    private String contractPdfFileName;
    private String contractPdfUrl;

    public static AdminContractSummaryResponse fromEntity(
            Contract c,
            String pdfFileName,
            StorageService storage
    ) {
        Room r = c.getRoom();
        Building b = (r != null ? r.getBuilding() : null);

        Integer pdfId = c.getContractPdfFileId();
        String pdfUrl = null;
        if (pdfId != null) {
            pdfUrl = (storage != null)
                    ? storage.resolveDownloadUrl(pdfId, "", "")
                    : "/files/" + pdfId + "/download";
            if (pdfUrl.isBlank()) pdfUrl = "/files/" + pdfId + "/download";
        }

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
                .lessorNm(b != null ? b.getBuildingLessorNm() : null)
                .tenantUserId(c.getUser() != null ? c.getUser().getUserId() : null)
                .tenantNm(c.getUser() != null ? c.getUser().getUserNm() : null)
                .contractStatus(c.getContractSt())
                .contractPdfFileId(pdfId)
                .contractPdfFileName(pdfFileName)
                .contractPdfUrl(pdfUrl)
                .build();
    }

    /** 하위 호환 */
    public static AdminContractSummaryResponse fromEntity(Contract c, String pdfFileName) {
        return fromEntity(c, pdfFileName, null);
    }
}