package org.myweb.uniplace.domain.support.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainReplyRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.ComplainResponse;
import org.myweb.uniplace.domain.commoncode.repository.CommonCodeRepository;
import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.domain.enums.ComplainImportance;
import org.myweb.uniplace.domain.support.infrastructure.ComplainAiClient;
import org.myweb.uniplace.domain.support.repository.ComplainRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ComplainServiceImpl implements ComplainService {

    private static final String DEFAULT_SUPPORT_CODE = "SUP_GENERAL";

    private final ComplainRepository complainRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final NotificationService notificationService;
    private final ComplainAiClient complainAiClient;  // ← 추가: AI 클라이언트

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ComplainResponse> search(ComplainSearchRequest request, Pageable pageable) {
        String normalizedCode = normalizeSupportCodeForFilter(request.getCode());
        Page<Complain> page = complainRepository.search(
                request.getUserId(),
                normalizedCode,
                request.getCompSt(),
                request.getKeyword(),
                pageable
        );
        return PageResponse.of(page.map(ComplainResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ComplainResponse> getMyList(String userId, Pageable pageable) {
        return PageResponse.of(
                complainRepository.findByUserId(userId, pageable).map(ComplainResponse::from)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ComplainResponse get(Integer compId) {
        Complain complain = complainRepository.findById(compId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPLAIN_NOT_FOUND));
        return ComplainResponse.from(complain);
    }

    @Override
    public ComplainResponse create(String userId, ComplainCreateRequest request) {
        Complain complain = Complain.builder()
                .compTitle(request.getCompTitle())
                .userId(userId)
                .compCtnt(request.getCompCtnt())
                .code(normalizeSupportCodeForWrite(request.getCode()))
                .build();
        Complain saved = complainRepository.save(complain);

        // 민원 접수 → 어드민 알림
        try {
            notificationService.notifyAdmins(
                NotificationType.COMP_NEW.name(),
                "새 민원이 접수되었습니다. compId=" + saved.getCompId() + ", userId=" + userId,
                userId, TargetType.support, null, "/admin/support/complain/" + saved.getCompId()
            );
        } catch (Exception e) {
            log.warn("[COMP][NOTIFY][ADMIN] compId={} reason={}", saved.getCompId(), e.getMessage());
        }

        // ↓ 추가: AI 중요도 분류 (비동기 — 사용자는 기다리지 않아도 됨)
        classifyAsync(saved.getCompId(), saved.getCompTitle(), saved.getCompCtnt());

        return ComplainResponse.from(saved);
    }

    /**
     * AI 중요도 분류 — 백그라운드 실행
     * @Async: 별도 스레드에서 실행되므로 create() 응답 속도에 영향 없음
     * 독립 트랜잭션(@Transactional)으로 AI 결과만 따로 DB 저장
     */
    @Async
    @Transactional
    public void classifyAsync(Integer compId, String title, String content) {
        try {
            ComplainAiClient.AiClassifyResult result =
                    complainAiClient.classify(compId, title, content);

            if (result == null || result.getImportance() == null) {
                log.warn("[COMP][AI] 분류 결과 없음 compId={}", compId);
                return;
            }

            ComplainImportance importance;
            try {
                importance = ComplainImportance.valueOf(result.getImportance());
            } catch (IllegalArgumentException e) {
                log.warn("[COMP][AI] 알 수 없는 중요도값 compId={} value={}", compId, result.getImportance());
                return;
            }

            complainRepository.findById(compId).ifPresent(c -> {
                c.updateAiResult(importance, result.getAiReason());
                log.info("[COMP][AI] 분류완료 compId={} importance={}", compId, importance);
            });

        } catch (Exception e) {
            log.warn("[COMP][AI] 분류 실패 compId={} reason={}", compId, e.getMessage());
        }
    }

    @Override
    public ComplainResponse update(Integer compId, ComplainUpdateRequest request) {
        Complain complain = complainRepository.findById(compId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPLAIN_NOT_FOUND));
        complain.update(request.getCompTitle(), request.getCompCtnt());
        return ComplainResponse.from(complain);
    }

    @Override
    public ComplainResponse updateStatus(Integer compId, ComplainUpdateRequest request) {
        Complain complain = complainRepository.findById(compId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPLAIN_NOT_FOUND));
        complain.updateStatus(request.getCompSt());
        return ComplainResponse.from(complain);
    }

    @Override
    public ComplainResponse createReply(Integer compId, ComplainReplyRequest request) {
        Complain complain = complainRepository.findById(compId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPLAIN_NOT_FOUND));
        complain.markReplied(request.getCompSt());

        // 민원 답변 → 민원인 알림
        try {
            notificationService.notifyUser(
                complain.getUserId(),
                NotificationType.COMP_REPLIED.name(),
                "접수하신 민원에 답변이 등록되었습니다.",
                null, TargetType.support, null, "/support/complain/" + compId
            );
        } catch (Exception e) {
            log.warn("[COMP][NOTIFY] replied compId={} reason={}", compId, e.getMessage());
        }

        return ComplainResponse.from(complain);
    }

    @Override
    public void delete(Integer compId) {
        if (!complainRepository.existsById(compId)) {
            throw new BusinessException(ErrorCode.COMPLAIN_NOT_FOUND);
        }
        complainRepository.deleteById(compId);
    }

    private String normalizeSupportCodeForFilter(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) return null;

        String mapped = mapSupportCode(rawCode);
        if ("ALL".equalsIgnoreCase(mapped)) return null;

        return commonCodeRepository.existsByCode(mapped) ? mapped : null;
    }

    private String normalizeSupportCodeForWrite(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) return DEFAULT_SUPPORT_CODE;

        String mapped = mapSupportCode(rawCode);
        if ("ALL".equalsIgnoreCase(mapped)) return DEFAULT_SUPPORT_CODE;

        if (mapped.startsWith("COMP_")) return mapped;

        return commonCodeRepository.existsByCode(mapped) ? mapped : DEFAULT_SUPPORT_CODE;
    }

    private String mapSupportCode(String rawCode) {
        String normalized = rawCode.trim().toUpperCase();

        return switch (normalized) {
            case "SUP_GENERAL", "GENERAL" -> "SUP_GENERAL";
            case "SUP_BILLING", "BILLING" -> "SUP_BILLING";
            case "COMP_PERSONAL", "COMP_FACILITY", "COMP_NOISE",
                 "COMP_CONTRACT", "COMP_SAFETY", "COMP_ETC" -> normalized;
            default -> {
                if (normalized.startsWith("COMP_")) yield normalized;
                yield normalized;
            }
        };
    }
}