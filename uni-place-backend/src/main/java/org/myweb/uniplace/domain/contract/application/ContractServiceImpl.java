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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final FileService fileService;
    private final ContractImageService contractImageService;

    private String currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthUser authUser) return authUser.getUserId();
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    @Override
    public ContractResponse createContract(ContractCreateRequest request) {
        String userId = currentUserId();

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Room room = roomRepository.findById(request.getRoomId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.isDeleted()) throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);

        boolean overlapped = contractRepository.existsOverlappedContract(
            room.getRoomId(),
            request.getContractStart(),
            request.getContractEnd(),
            ContractStatus.active,
            ContractStatus.active
        );
        if (overlapped) throw new BusinessException(ErrorCode.BAD_REQUEST);

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
            List<FileResponse> files = uploadResp != null ? uploadResp.getFiles() : null;
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
        return contractRepository.findMyContracts(userId).stream()
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
        // ✅ fetch join으로 room + building 한 번에 로드 (이미지 생성 시 LAZY 로딩 방지)
        Contract c = contractRepository.findWithRoomAndBuilding(contractId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));

        boolean justApproved = false;

        if (request.getContractStatus() != null) {
            ContractStatus prevStatus = c.getContractSt();
            c.setContractSt(request.getContractStatus());

            if (request.getContractStatus() == ContractStatus.active
                    && prevStatus != ContractStatus.active) {
                c.setSignAt(LocalDateTime.now());
                justApproved = true;
            }
        }

        if (request.getMoveinAt() != null) {
            c.setMoveinAt(request.getMoveinAt());
        }

        // 관리자가 직접 파일 업로드하는 경우
        if (request.getPdfFile() != null && !request.getPdfFile().isEmpty()) {
            FileUploadResponse uploadResp = fileService.uploadFiles(
                FileUploadRequest.builder()
                    .fileParentType(FileRefType.CONTRACT.dbValue())
                    .fileParentId(c.getContractId())
                    .files(List.of(request.getPdfFile()))
                    .build()
            );
            List<FileResponse> files = uploadResp != null ? uploadResp.getFiles() : null;
            if (files != null && !files.isEmpty() && files.get(0) != null) {
                c.setContractPdfFileId(files.get(0).getFileId());
            }
        }

        c = contractRepository.save(c);

        // ✅ 승인 직후 계약서 이미지 자동 생성
        if (justApproved && c.getContractPdfFileId() == null) {
            try {
                Integer imageFileId = contractImageService.generateAndSave(c);
                if (imageFileId != null) {
                    c.setContractPdfFileId(imageFileId);
                    c = contractRepository.save(c);
                    log.info("[Contract] 계약 #{} 이미지 생성 완료 fileId={}", contractId, imageFileId);
                } else {
                    log.warn("[Contract] 계약 #{} 이미지 생성 null 반환 - application.properties 경로 확인 필요", contractId);
                }
            } catch (Exception e) {
                log.error("[Contract] 계약 #{} 이미지 생성 실패 (승인은 완료됨)", contractId, e);
            }
        }

        return ContractResponse.fromEntity(c);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminContractSummaryResponse> searchAdminContracts(
            ContractAdminSearchRequest request, Pageable pageable) {

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
                    pdfFileName = file != null ? file.getOriginFilename() : null;
                } catch (Exception ignored) {}
            }
            return AdminContractSummaryResponse.fromEntity(c, pdfFileName);
        });
    }
}
