package org.myweb.uniplace.domain.contract.application;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.myweb.uniplace.domain.contract.api.dto.request.ContractAdminSearchRequest;
import org.myweb.uniplace.domain.contract.api.dto.request.ContractCreateRequest;
import org.myweb.uniplace.domain.contract.api.dto.request.ContractUpdateRequest;
import org.myweb.uniplace.domain.contract.api.dto.response.AdminContractSummaryResponse;
import org.myweb.uniplace.domain.contract.api.dto.response.ContractResponse;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.entity.Resident;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.contract.repository.ResidentRepository;
import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.file.domain.enums.FileRefType;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
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

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final ContractRepository contractRepository;
    private final ResidentRepository residentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final FileService fileService;
    private final ContractImageService contractImageService;
    private final NotificationService notificationService;

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
        validateContractPeriod(request.getContractStart(), request.getContractEnd());

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Room room = roomRepository.findById(request.getRoomId())
            .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.isDeleted()) throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);

        boolean roomOverlapped = contractRepository.existsOverlappedContract(
            room.getRoomId(),
            request.getContractStart(),
            request.getContractEnd(),
            List.of(ContractStatus.requested, ContractStatus.approved, ContractStatus.active)
        );
        if (roomOverlapped) throw new BusinessException(ErrorCode.CONTRACT_OVERLAP);

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

        safeNotifyAdmins(
            NotificationType.CONTRACT_REQ.name(),
            "계약 신청이 접수되었습니다. userId=" + userId + ", roomId=" + room.getRoomId(),
            null
        );

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

        if (saved.getContractPdfFileId() == null) {
            try {
                Contract full = contractRepository.findWithRoomAndBuilding(saved.getContractId()).orElse(saved);
                Integer fileId = contractImageService.generateAndSave(full);
                if (fileId != null) {
                    saved.setContractPdfFileId(fileId);
                    saved = contractRepository.save(saved);
                    log.info("[Contract] generated document at request contractId={} fileId={}", saved.getContractId(), fileId);
                } else {
                    log.warn("[Contract] document generation returned null contractId={}", saved.getContractId());
                }
            } catch (Exception e) {
                log.error("[Contract] document generation failed contractId={}", saved.getContractId(), e);
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

        LocalDate today = todayKst();
        ContractStatus prevStatus = c.getContractSt();
        ContractStatus targetStatus = prevStatus;
        boolean justApproved = false;
        boolean justActivated = false;
        boolean justDeactivatedFromActive = false;

        if (request.getContractStatus() != null) {
            targetStatus = request.getContractStatus();

            if (targetStatus == ContractStatus.approved && !c.getContractStart().isAfter(today)) {
                targetStatus = ContractStatus.active;
            }

            justApproved = (targetStatus == ContractStatus.approved && prevStatus != ContractStatus.approved);
            justActivated = (targetStatus == ContractStatus.active && prevStatus != ContractStatus.active);
            justDeactivatedFromActive = (prevStatus == ContractStatus.active && targetStatus != ContractStatus.active);

            c.setContractSt(targetStatus);

            if ((justApproved || justActivated) && c.getSignAt() == null) {
                c.setSignAt(LocalDateTime.now(KST));
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

        if (justActivated) {
            applyActivationEffects(c, true);
        } else if (justApproved) {
            notifyApproved(c);
        }

        if (justDeactivatedFromActive) {
            applyDeactivationEffects(c, targetStatus, true);
        }

        if ((justApproved || justActivated) && c.getContractPdfFileId() == null) {
            try {
                Integer imageFileId = contractImageService.generateAndSave(c);
                if (imageFileId != null) {
                    c.setContractPdfFileId(imageFileId);
                    c = contractRepository.save(c);
                    log.info("[Contract] generated document after approval contractId={} fileId={}", contractId, imageFileId);
                } else {
                    log.warn("[Contract] document generation returned null after approval contractId={}", contractId);
                }
            } catch (Exception e) {
                log.error("[Contract] document generation failed after approval contractId={}", contractId, e);
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
                } catch (Exception ignored) {
                }
            }
            return AdminContractSummaryResponse.fromEntity(c, pdfFileName);
        });
    }

    @Scheduled(cron = "${contract.status-transition-cron:0 5 0 * * *}", zone = "Asia/Seoul")
    public void runContractStatusTransition() {
        LocalDate today = todayKst();
        log.info("[ContractScheduler] transition start today={}", today);

        List<Contract> toActivate = contractRepository.findForAutoActivate(ContractStatus.approved, today);
        for (Contract c : toActivate) {
            if (c.getContractSt() != ContractStatus.approved) continue;
            c.setContractSt(ContractStatus.active);
            if (c.getSignAt() == null) c.setSignAt(LocalDateTime.now(KST));
            c = contractRepository.save(c);
            applyActivationEffects(c, false);
            log.info("[ContractScheduler] approved->active contractId={} userId={}", c.getContractId(),
                c.getUser() != null ? c.getUser().getUserId() : null);
        }

        List<Contract> toEnd = contractRepository.findForAutoEnd(ContractStatus.active, today);
        for (Contract c : toEnd) {
            if (c.getContractSt() != ContractStatus.active) continue;
            c.setContractSt(ContractStatus.ended);
            c = contractRepository.save(c);
            applyDeactivationEffects(c, ContractStatus.ended, false);
            log.info("[ContractScheduler] active->ended contractId={} userId={}", c.getContractId(),
                c.getUser() != null ? c.getUser().getUserId() : null);
        }

        log.info("[ContractScheduler] transition done activateCount={} endCount={}", toActivate.size(), toEnd.size());
    }

    private void applyActivationEffects(Contract c, boolean notifyUser) {
        String userId = (c.getUser() != null ? c.getUser().getUserId() : null);
        Integer buildingId = (c.getRoom() != null && c.getRoom().getBuilding() != null)
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
                log.info("[Resident] created contractId={} userId={}", c.getContractId(), userId);
            }
        }

        if (c.getRoom() != null) {
            Room room = c.getRoom();
            room.setRoomSt(RoomStatus.contracted);
            roomRepository.save(room);
            log.info("[Room] set contracted contractId={} roomId={}", c.getContractId(), room.getRoomId());
        }

        if (c.getUser() != null && c.getUser().getUserRole() == UserRole.user) {
            c.getUser().changeRole(UserRole.tenant);
            userRepository.save(c.getUser());
            log.info("[UserRole] promoted to tenant contractId={} userId={}", c.getContractId(), c.getUser().getUserId());
        }

        if (notifyUser && userId != null) {
            safeNotify(userId, NotificationType.CONTRACT_CFM.name(),
                "계약이 활성화되었습니다. 계약 번호: " + c.getContractId());
        }
    }

    private void applyDeactivationEffects(Contract c, ContractStatus newStatus, boolean notifyUser) {
        String userId = (c.getUser() != null ? c.getUser().getUserId() : null);

        if (userId != null) {
            residentRepository.deleteByContractIdAndUserId(c.getContractId(), userId);
            log.info("[Resident] deleted contractId={} userId={}", c.getContractId(), userId);

            if (notifyUser) {
                safeNotify(userId, NotificationType.CONTRACT_CAN.name(),
                    "계약 상태가 변경되었습니다. 상태: " + newStatus.name() + ", 계약 번호: " + c.getContractId());
            }
        }

        if (c.getRoom() != null) {
            Room room = c.getRoom();
            room.setRoomSt(RoomStatus.available);
            roomRepository.save(room);
            log.info("[Room] set available contractId={} roomId={} status={}",
                c.getContractId(), room.getRoomId(), newStatus);
        }

        if (c.getUser() != null && c.getUser().getUserRole() == UserRole.tenant) {
            boolean hasOtherActive = contractRepository.existsByUser_UserIdAndContractSt(
                c.getUser().getUserId(), ContractStatus.active
            );
            if (!hasOtherActive) {
                c.getUser().changeRole(UserRole.user);
                userRepository.save(c.getUser());
                log.info("[UserRole] rolled back to user userId={}", c.getUser().getUserId());
            }
        }
    }

    private void notifyApproved(Contract c) {
        String userId = (c.getUser() != null ? c.getUser().getUserId() : null);
        if (userId != null) {
            safeNotify(userId, NotificationType.CONTRACT_CFM.name(),
                "계약이 승인되었습니다. 시작일에 자동으로 활성화됩니다. 계약 번호: " + c.getContractId());
        }
    }

    private void validateContractPeriod(LocalDate contractStart, LocalDate contractEnd) {
        if (contractStart == null || contractEnd == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (contractStart.isBefore(todayKst())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (contractEnd.isBefore(contractStart.plusDays(7))) {
            throw new BusinessException(ErrorCode.CONTRACT_INVALID_PERIOD);
        }
    }

    private LocalDate todayKst() {
        return LocalDate.now(KST);
    }

    private void safeNotify(String userId, String code, String msg) {
        try {
            notificationService.notifyUser(userId, code, msg, null,
                TargetType.notice, null, "/me?tab=myroom&sub=contracts");
        } catch (Exception e) {
            log.warn("[CONTRACT][NOTIFY] failed userId={} code={} reason={}", userId, code, e.getMessage());
        }
    }

    private void safeNotifyAdmins(String code, String msg, Integer contractId) {
        try {
            notificationService.notifyAdmins(code, msg, null,
                TargetType.notice, contractId, "/admin/contracts");
        } catch (Exception e) {
            log.warn("[CONTRACT][NOTIFY][ADMIN] code={} reason={}", code, e.getMessage());
        }
    }
}
