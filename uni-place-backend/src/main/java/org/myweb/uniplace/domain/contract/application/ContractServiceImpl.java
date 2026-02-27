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
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
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

    private String currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthUser authUser) {
            return authUser.getUserId();
        }
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    @Override
    public ContractResponse createContract(ContractCreateRequest request) {
        String userId = currentUserId();

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Room room = roomRepository.findById(request.getRoomId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.isDeleted()) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        boolean overlapped = contractRepository.existsOverlappedContract(
            room.getRoomId(),
            request.getContractStart(),
            request.getContractEnd(),
            ContractStatus.requested,
            ContractStatus.active
        );
        if (overlapped) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
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
            .lessorAddr(request.getLessorAddr())
            .lessorRrn(request.getLessorRrn())
            .lessorTel(request.getLessorTel())
            .lessorNm(request.getLessorNm())
            .build();

        Contract saved = contractRepository.save(contract);

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
                saved = contractRepository.save(saved);
            }
        }

        return ContractResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractResponse> getMyContracts() {
        String userId = currentUserId();
        List<Contract> list = contractRepository.findMyContracts(userId);

        return list.stream()
            .map(ContractResponse::fromEntity)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse getContractForAdmin(Integer contractId) {
        Contract c = contractRepository.findById(contractId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));
        return ContractResponse.fromEntity(c);
    }
    
    @Override
    public ContractResponse updateContractForAdmin(Integer contractId, ContractUpdateRequest request) {
        Contract c = contractRepository.findById(contractId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));

        if (request.getContractStatus() != null) {
            c.setContractSt(request.getContractStatus());
            if (request.getContractStatus() == ContractStatus.active && c.getSignAt() == null) {
                c.setSignAt(LocalDateTime.now());
            }
        }

        if (request.getMoveinAt() != null) {
            c.setMoveinAt(request.getMoveinAt());
        }

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
                c = contractRepository.save(c);
            }
        }

        return ContractResponse.fromEntity(c);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminContractSummaryResponse> searchAdminContracts(ContractAdminSearchRequest request, Pageable pageable) {
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
