package org.myweb.uniplace.domain.support.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainReplyRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.ComplainResponse;
import org.myweb.uniplace.domain.commoncode.repository.CommonCodeRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.repository.ComplainRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ComplainServiceImpl implements ComplainService {

    private static final String DEFAULT_SUPPORT_CODE = "SUP_GENERAL";

    private final ComplainRepository     complainRepository;
    private final CommonCodeRepository   commonCodeRepository;
    private final NotificationService    notificationService;
    private final ComplainAiAsyncService complainAiAsyncService;

    // -------------------------------------------------------
    // 조회
    // -------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ComplainResponse> search(ComplainSearchRequest request, Pageable pageable) {
        String normalizedCode = normalizeSupportCodeForFilter(request.getCode());
        Page<Complain> page = complainRepository.search(
                request.getUserId(),
                normalizedCode,
                request.getCompSt(),
                request.getImportance(),
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

    // -------------------------------------------------------
    // 민원 등록
    // -------------------------------------------------------

    @Override
    public ComplainResponse create(String userId, ComplainCreateRequest request) {

        // 1. 민원 저장
        Complain complain = Complain.builder()
                .compTitle(request.getCompTitle())
                .userId(userId)
                .compCtnt(request.getCompCtnt())
                .code(normalizeSupportCodeForWrite(request.getCode()))
                .build();
        Complain saved = complainRepository.save(complain);

        // 2. AI 분류 + 알림 비동기 처리
        complainAiAsyncService.classifyAndNotify(
                saved.getCompId(), userId,
                request.getCompTitle(), request.getCompCtnt()
        );

        return ComplainResponse.from(saved);
    }

    // -------------------------------------------------------
    // 수정 / 상태변경 / 답변 / 삭제
    // -------------------------------------------------------

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

        // 답변 내용 + 상태 저장
        complain.markReplied(request.getCompSt(), request.getReplyCtnt());

        try {
            notificationService.notifyUser(
                    complain.getUserId(),
                    NotificationType.COMP_REPLIED.name(),
                    "접수하신 민원에 답변이 등록되었습니다.",
                    null,
                    TargetType.support,
                    null,
                    "/support/complain/" + compId
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

    // -------------------------------------------------------
    // 코드 정규화 유틸
    // -------------------------------------------------------

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