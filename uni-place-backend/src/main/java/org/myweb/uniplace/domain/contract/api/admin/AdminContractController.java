package org.myweb.uniplace.domain.contract.api.admin;

import org.myweb.uniplace.domain.contract.api.dto.request.ContractAdminSearchRequest;
import org.myweb.uniplace.domain.contract.api.dto.request.ContractUpdateRequest;
import org.myweb.uniplace.domain.contract.api.dto.response.AdminContractSummaryResponse;
import org.myweb.uniplace.domain.contract.api.dto.response.ContractResponse;
import org.myweb.uniplace.domain.contract.application.ContractService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/contracts")
public class AdminContractController {

    private final ContractService contractService;

    // ======================================
    // 관리자: 계약 목록 조회 (검색 + 페이징)
    // ======================================
    @GetMapping
    public ApiResponse<PageResponse<AdminContractSummaryResponse>> list(
            @ModelAttribute ContractAdminSearchRequest request,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "contractId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {

        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        var result = contractService.searchAdminContracts(request, pageable);

        return ApiResponse.ok(PageResponse.of(result));
    }

    // ======================================
    // 관리자: 계약 수정 (상태 + PDF + 기타)
    // ======================================
    @PutMapping(value = "/{contractId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ContractResponse> updateContract(
            @PathVariable("contractId") Integer contractId,
            @Validated @ModelAttribute ContractUpdateRequest request
    ) {
        return ApiResponse.ok(
                contractService.updateContractForAdmin(contractId, request)
        );
    }
}