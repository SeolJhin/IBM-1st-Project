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
import org.myweb.uniplace.domain.contract.repository.ResidentRepository;
import org.myweb.uniplace.domain.contract.domain.entity.Resident;
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
    private final ResidentRepository residentRepository;
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
        
        // 2) ✅ 신청 즉시 계약서(PDF/이미지) 생성 + 저장 + contract_pdf_file_id 세팅
        if (saved.getContractPdfFileId() == null) {
            try {
                // generateAndSave()에서 room/building 접근할 수 있으니 fetch join으로 다시 로드
                Contract full = contractRepository.findWithRoomAndBuilding(saved.getContractId())
                    .orElse(saved);

                Integer fileId = contractImageService.generateAndSave(full);
                if (fileId != null) {
                    saved.setContractPdfFileId(fileId);
                    saved = contractRepository.save(saved);
                    log.info("[Contract] 신청 즉시 계약서 생성 완료 contractId={} fileId={}", saved.getContractId(), fileId);
                } else {
                    log.warn("[Contract] 신청 즉시 계약서 생성 실패(null) contractId={}", saved.getContractId());
                }
            } catch (Exception e) {
                log.error("[Contract] 신청 즉시 계약서 생성 예외 contractId={}", saved.getContractId(), e);
                // 정책: 여기서 예외를 던지면 계약 생성 자체가 롤백됨.
                // 지금처럼 로그만 남기면 계약은 생성되지만 계약서 파일이 없을 수 있음.
                // 원하면 throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR)로 바꿔도 됨.
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
        Contract c = contractRepository.findWithRoomAndBuilding(contractId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));

        boolean justApproved = false;
        boolean justDeactivatedFromActive = false;
        ContractStatus prevStatus = c.getContractSt();

        if (request.getContractStatus() != null) {
            c.setContractSt(request.getContractStatus());

            // active 전환(승인) 감지
            if (request.getContractStatus() == ContractStatus.active
                    && prevStatus != ContractStatus.active) {
                c.setSignAt(LocalDateTime.now());
                justApproved = true;
            }

            // active -> 비활성(취소/종료 등) 감지
            if (prevStatus == ContractStatus.active
                    && request.getContractStatus() != ContractStatus.active) {
                justDeactivatedFromActive = true;
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
            List<FileResponse> files = uploadResp != null ? uploadResp.getFiles() : null;
            if (files != null && !files.isEmpty() && files.get(0) != null) {
                c.setContractPdfFileId(files.get(0).getFileId());
            }
        }

        c = contractRepository.save(c);

        // ✅ (A) 승인(active) 시: resident 자동 생성 (멱등)
        if (justApproved) {
            String userId = (c.getUser() != null ? c.getUser().getUserId() : null);
            Integer buildingId =
                    (c.getRoom() != null && c.getRoom().getBuilding() != null)
                            ? c.getRoom().getBuilding().getBuildingId()
                            : null;

            if (userId != null && buildingId != null) {
                boolean exists = residentRepository.existsByContractIdAndUserId(c.getContractId(), userId);
                if (!exists) {
                    residentRepository.save(
                            Resident.builder()
                                    .buildingId(buildingId)
                                    .contractId(c.getContractId())
                                    .userId(userId)
                                    .build()
                    );
                    log.info("[Resident] auto created by contract approval contractId={} userId={}", c.getContractId(), userId);
                }
            }
        }

        // ✅ (B) active 해제(취소/종료 등) 시: resident 자동 삭제
        if (justDeactivatedFromActive) {
            String userId = (c.getUser() != null ? c.getUser().getUserId() : null);
            if (userId != null) {
                residentRepository.deleteByContractIdAndUserId(c.getContractId(), userId);
                log.info("[Resident] auto deleted by contract deactivation contractId={} userId={}", c.getContractId(), userId);
            }
        }

        // ✅ 승인 직후 계약서 이미지 자동 생성(기존 유지)
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
