package org.myweb.uniplace.domain.contract.application;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.contract.api.dto.request.ContractAdminSearchRequest;
import org.myweb.uniplace.domain.contract.api.dto.request.ContractCreateRequest;
import org.myweb.uniplace.domain.contract.api.dto.request.ContractUpdateRequest;
import org.myweb.uniplace.domain.contract.api.dto.response.AdminContractSummaryResponse;
import org.myweb.uniplace.domain.contract.api.dto.response.ContractResponse;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.file.domain.enums.FileRefType;

import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final FileService fileService;

    // ===========================
    // 공통: 현재 로그인 userId
    // ===========================
    private String currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof AuthUser authUser) {
            return authUser.getUserId();
        }
        throw new IllegalStateException("인증 정보가 없습니다.");
    }

    // ===========================
    // 회원: 계약 신청
    // ===========================
    @Override
    public ContractResponse createContract(ContractCreateRequest request) {

        String userId = currentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다. userId=" + userId));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("객실을 찾을 수 없습니다. roomId=" + request.getRoomId()));

        // 기간 겹침 체크 (requested + active)
        boolean overlapped = contractRepository.existsOverlappedContract(
                room.getRoomId(),
                request.getContractStart(),
                request.getContractEnd(),
                ContractStatus.requested,
                ContractStatus.active
        );
        if (overlapped) {
            throw new IllegalArgumentException("해당 기간에 이미 계약 진행/유효 계약이 존재합니다.");
        }

        Contract contract = Contract.builder()
                .user(user)
                .room(room)
                .contractStart(request.getContractStart())
                .contractEnd(request.getContractEnd())
                .deposit(room.getDeposit())
                .rentPrice(room.getRentPrice())
                .manageFee(room.getManageFee())
                .paymentDay(request.getPaymentDay())
                .rentType(Contract.RentType.monthly_rent)
                .contractSt(ContractStatus.requested)

                // 회원 입력(임대인)
                .lessorAddr(request.getLessorAddr())
                .lessorRrn(request.getLessorRrn())
                .lessorTel(request.getLessorTel())
                .lessorName(request.getLessorName())
                .build();

        // 1) 계약 먼저 저장(계약ID 필요)
        Contract saved = contractRepository.save(contract);

        // 2) 서명/날인 파일 업로드 후 file_id를 계약에 세팅
        if (request.getSignFile() != null && !request.getSignFile().isEmpty()) {

            FileUploadResponse uploadResp = fileService.uploadFiles(
                    FileUploadRequest.builder()
                            .fileParentType(FileRefType.CONTRACT.dbValue())
                            .fileParentId(saved.getContractId())
                            .files(List.of(request.getSignFile()))
                            .build()
            );

            List<FileResponse> files = (uploadResp != null ? uploadResp.getFiles() : null);

            if (files != null && !files.isEmpty() && files.get(0) != null) {
                saved.setLessorSignFileId(files.get(0).getFileId());

                // ✅ dirty-check로도 반영되지만, 응답/동작 일관성 위해 명시적으로 save
                saved = contractRepository.save(saved);
            }
        }

        return ContractResponse.fromEntity(saved);
    }

    // ===========================
    // 회원: 내 계약 목록
    // ===========================
    @Override
    @Transactional(readOnly = true)
    public List<ContractResponse> getMyContracts() {

        String userId = currentUserId();
        List<Contract> list = contractRepository.findMyContracts(userId);

        return list.stream()
                .map(ContractResponse::fromEntity)
                .toList();
    }

    // ===========================
    // 관리자: 계약 수정 (상태 + PDF + 기타)
    // ===========================
    @Override
    public ContractResponse updateContractForAdmin(
            Integer contractId,
            ContractUpdateRequest request
    ) {

        Contract c = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("계약을 찾을 수 없습니다. contractId=" + contractId));

        // 1) 상태 변경
        if (request.getContractStatus() != null) {
            c.setContractSt(request.getContractStatus());

            // 승인(active) 시 승인일시 자동 세팅
            if (request.getContractStatus() == ContractStatus.active && c.getSignAt() == null) {
                c.setSignAt(LocalDateTime.now());
            }
        }

        // 2) 입주일 수정
        if (request.getMoveinAt() != null) {
            c.setMoveinAt(request.getMoveinAt());
        }

        // 3) 계약서 PDF 업로드 (FileUploadResponse 반영)
        if (request.getPdfFile() != null && !request.getPdfFile().isEmpty()) {

            FileUploadResponse uploadResp = fileService.uploadFiles(
                    FileUploadRequest.builder()
                            .fileParentType(FileRefType.CONTRACT.dbValue())
                            .fileParentId(c.getContractId())
                            .files(List.of(request.getPdfFile()))
                            .build()
            );

            List<FileResponse> files = (uploadResp != null ? uploadResp.getFiles() : null);

            if (files != null && !files.isEmpty() && files.get(0) != null) {
                c.setContractPdfFileId(files.get(0).getFileId());

                // ✅ 응답/동작 일관성 위해 명시적으로 save
                c = contractRepository.save(c);
            }
        }

        return ContractResponse.fromEntity(c);
    }

    // ===========================
    // 관리자: 계약 목록 조회 (검색 + 페이징)
    // ===========================
    @Override
    @Transactional(readOnly = true)
    public Page<AdminContractSummaryResponse> searchAdminContracts(
            ContractAdminSearchRequest request,
            Pageable pageable
    ) {

        Page<Contract> page = contractRepository.searchAdminPage(
                request.getKeyword(),
                request.getContractStatus(),
                request.getBuildingId(),
                request.getRoomNo(),
                request.getStartFrom(),
                request.getEndTo(),
                pageable
        );

        return page.map(c -> {

            String pdfFileName = null;

            Integer pdfId = c.getContractPdfFileId();
            if (pdfId != null) {
                try {
                    FileResponse file = fileService.getFile(pdfId);
                    pdfFileName = (file != null ? file.getOriginFilename() : null);
                } catch (Exception ignored) {
                    pdfFileName = null;
                }
            }

            return AdminContractSummaryResponse.fromEntity(c, pdfFileName);
        });
    }
}