package org.myweb.uniplace.domain.contract.api.dto.request;

import java.time.LocalDate;

import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractAdminSearchRequest {

    // 검색 키워드(건물명/임대인명/임차인ID)
    private String keyword;

    // 개별 필터(선택)
    private ContractStatus contractStatus;

    private Integer buildingId;
    private Integer roomNo;

    private LocalDate startFrom;
    private LocalDate endTo;
}