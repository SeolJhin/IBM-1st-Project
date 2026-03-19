package org.myweb.uniplace.domain.contract.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.global.storage.StorageService;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractResponse {

    private Integer contractId;
    private Integer roomId;
    private Integer roomNo;
    private Integer buildingId;
    private String buildingNm;
    private String buildingAddr;
    private LocalDate contractStart;
    private LocalDate contractEnd;
    private BigDecimal deposit;
    private BigDecimal rentPrice;
    private BigDecimal manageFee;
    private Integer paymentDay;
    private ContractStatus contractStatus;
    private String lessorNm;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime moveinAt;
    private Integer contractPdfFileId;
    private String contractPdfUrl;

    /**
     * StorageService 를 받아서 환경에 맞는 PDF URL 생성
     */
    public static ContractResponse fromEntity(Contract c, StorageService storage) {
        Room r = c.getRoom();
        Building b = (r != null ? r.getBuilding() : null);

        Integer pdfId = c.getContractPdfFileId();
        String pdfUrl = null;
        if (pdfId != null && storage != null) {
            // PDF 파일 메타가 없으므로 fileId 기반 로컬 URL 또는 스토리지에서 직접 처리
            // 로컬: /files/{id}/download  /  S3: S3 URL (FileResponse 통해 처리 권장)
            pdfUrl = storage.resolveDownloadUrl(pdfId, "", "");
            // 로컬이면 /files/{pdfId}/download 반환, S3이면 baseUrl 기반 URL 반환
            // S3의 경우 실제 경로가 없으므로 아래처럼 fileId 기반 URL 사용
            if (pdfUrl.isBlank()) pdfUrl = "/files/" + pdfId + "/download";
        } else if (pdfId != null) {
            pdfUrl = "/files/" + pdfId + "/download";
        }

        return ContractResponse.builder()
                .contractId(c.getContractId())
                .roomId(r != null ? r.getRoomId() : null)
                .roomNo(r != null ? r.getRoomNo() : null)
                .buildingId(b != null ? b.getBuildingId() : null)
                .buildingNm(b != null ? b.getBuildingNm() : null)
                .buildingAddr(b != null ? b.getBuildingAddr() : null)
                .contractStart(c.getContractStart())
                .contractEnd(c.getContractEnd())
                .deposit(c.getDeposit())
                .rentPrice(c.getRentPrice())
                .manageFee(c.getManageFee())
                .paymentDay(c.getPaymentDay())
                .contractStatus(c.getContractSt())
                .lessorNm(c.getLessorNm())
                .requestedAt(c.getCreatedAt())
                .approvedAt(c.getSignAt())
                .moveinAt(c.getMoveinAt())
                .contractPdfFileId(pdfId)
                .contractPdfUrl(pdfUrl)
                .build();
    }

    /** 하위 호환 (StorageService 없이 호출 시 로컬 URL 사용) */
    public static ContractResponse fromEntity(Contract c) {
        return fromEntity(c, null);
    }
}