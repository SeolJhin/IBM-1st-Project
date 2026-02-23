package org.myweb.uniplace.domain.contract.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;

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

    // ✅ 임대인(회원 입력)
    private String lessorName;

    // 마이페이지/관리자 공통 표시
    private LocalDateTime requestedAt; // createdAt
    private LocalDateTime approvedAt;  // signAt
    private LocalDateTime moveinAt;

    // 계약서 다운로드
    private Integer contractPdfFileId;
    private String contractPdfUrl;

    public static ContractResponse fromEntity(Contract c) {
        Room r = c.getRoom();
        Building b = (r != null ? r.getBuilding() : null);

        Integer pdfId = c.getContractPdfFileId();
        String pdfUrl = (pdfId != null) ? ("/files/" + pdfId + "/download") : null;

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

                .lessorName(c.getLessorName())

                .requestedAt(c.getCreatedAt())
                .approvedAt(c.getSignAt())
                .moveinAt(c.getMoveinAt())

                .contractPdfFileId(pdfId)
                .contractPdfUrl(pdfUrl)
                .build();
    }
}