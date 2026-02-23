package org.myweb.uniplace.domain.contract.api;

import java.util.List;

import org.myweb.uniplace.domain.contract.api.dto.request.ContractCreateRequest;
import org.myweb.uniplace.domain.contract.api.dto.response.ContractResponse;
import org.myweb.uniplace.domain.contract.application.ContractService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/contracts")
public class ContractController {

    private final ContractService contractService;

    /**
     * 계약 생성
     * POST /contracts
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ContractResponse>> createContract(
            @Validated @ModelAttribute ContractCreateRequest request
    ) {
        ContractResponse response = contractService.createContract(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * 내 계약 조회
     * GET /contracts/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getMyContracts() {
        return ResponseEntity.ok(ApiResponse.ok(contractService.getMyContracts()));
    }
}