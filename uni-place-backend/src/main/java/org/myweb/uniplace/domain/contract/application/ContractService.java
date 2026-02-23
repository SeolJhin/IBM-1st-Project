package org.myweb.uniplace.domain.contract.application;

import java.util.List;

import org.myweb.uniplace.domain.contract.api.dto.request.ContractAdminSearchRequest;
import org.myweb.uniplace.domain.contract.api.dto.request.ContractCreateRequest;
import org.myweb.uniplace.domain.contract.api.dto.request.ContractUpdateRequest;
import org.myweb.uniplace.domain.contract.api.dto.response.AdminContractSummaryResponse;
import org.myweb.uniplace.domain.contract.api.dto.response.ContractResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContractService {

    ContractResponse createContract(ContractCreateRequest request);

    List<ContractResponse> getMyContracts();

    ContractResponse updateContractForAdmin(Integer contractId, ContractUpdateRequest request);

    // ✅ 신규: 관리자 계약 목록 조회(검색 + 페이징)
    Page<AdminContractSummaryResponse> searchAdminContracts(ContractAdminSearchRequest request, Pageable pageable);
}