package org.myweb.uniplace.domain.support.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.commoncode.repository.CommonCodeRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.support.api.dto.request.*;
import org.myweb.uniplace.domain.support.api.dto.response.QnaResponse;
import org.myweb.uniplace.domain.support.domain.entity.Qna;
import org.myweb.uniplace.domain.support.domain.enums.QnaStatus;
import org.myweb.uniplace.domain.support.repository.QnaRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.myweb.uniplace.domain.ai.application.moderation.BannedWordService;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class QnaServiceImpl implements QnaService {

    private static final String DEFAULT_SUPPORT_CODE = "SUP_GENERAL";

    private final QnaRepository qnaRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final NotificationService notificationService;
    private final BannedWordService bannedWordService;

    // ────────────────────────── 조회 ──────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<QnaResponse> search(
            QnaSearchRequest request,
            Pageable pageable,
            String requesterUserId,
            boolean isAdmin
    ) {
        String normalizedCode = normalizeSupportCodeForFilter(request.getCode());
        String targetUserId = isAdmin ? request.getUserId() : requesterUserId;
        Page<Qna> page = qnaRepository.search(
                targetUserId,
                normalizedCode,
                request.getQnaSt(),
                request.getKeyword(),
                pageable
        );
        return PageResponse.of(page.map(QnaResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<QnaResponse> searchAll(QnaSearchRequest request, Pageable pageable) {
        String normalizedCode = normalizeSupportCodeForFilter(request.getCode());
        Page<Qna> page = qnaRepository.searchAll(
                normalizedCode,
                request.getQnaSt(),
                request.getKeyword(),
                pageable
        );
        return PageResponse.of(page.map(QnaResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public QnaResponse get(Integer qnaId, String requesterUserId, boolean isAdmin) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        ensureReadAccess(qna, requesterUserId, isAdmin);
        return QnaResponse.from(qna);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QnaResponse> getReplies(Integer qnaId, String requesterUserId, boolean isAdmin) {
        Qna question = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        ensureReadAccess(question, requesterUserId, isAdmin);
        return qnaRepository.findByParentIdOrderByQnaIdAsc(qnaId)
                .stream()
                .map(QnaResponse::from)
                .collect(Collectors.toList());
    }

    // ────────────────────────── 질문 CRUD ──────────────────────────

    @Override
    public QnaResponse create(String userId, QnaCreateRequest request) {
        Qna qna = Qna.builder()
                .parentId(request.getParentId())
                .qnaTitle(bannedWordService.filter(request.getQnaTitle()))
                .userId(userId)
                .qnaCtnt(bannedWordService.filter(request.getQnaCtnt()))
                .code(normalizeSupportCodeForWrite(request.getCode()))
                .groupId(request.getGroupId())
                .qnaLev(request.getQnaLev() != null ? request.getQnaLev() : 0)
                .build();
        Qna saved = qnaRepository.save(qna);

        // QnA 질문 접수 → 어드민 알림
        try {
            notificationService.notifyAdmins(
                NotificationType.QNA_NEW.name(),
                "새 QnA 질문이 접수되었습니다. qnaId=" + saved.getQnaId() + ", userId=" + userId,
                userId, TargetType.support, null, "/admin/support/qna/" + saved.getQnaId()
            );
        } catch (Exception e) {
            log.warn("[QNA][NOTIFY][ADMIN] qnaId={} reason={}", saved.getQnaId(), e.getMessage());
        }

        return QnaResponse.from(saved);
    }

    @Override
    public QnaResponse update(Integer qnaId, QnaUpdateRequest request) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        String filteredTitle = bannedWordService.filter(request.getQnaTitle());
        String filteredContent = bannedWordService.filter(request.getQnaCtnt());

        qna.update(filteredTitle, filteredContent);
        return QnaResponse.from(qna);
    }

    @Override
    public void delete(Integer qnaId) {
        if (!qnaRepository.existsById(qnaId)) {
            throw new BusinessException(ErrorCode.QNA_NOT_FOUND);
        }
        qnaRepository.deleteById(qnaId);
    }

    // ────────────────────────── 관리자 답변 ──────────────────────────

    @Override
    public QnaResponse createAnswer(Integer qnaId, String adminUserId, QnaAnswerRequest request) {
        Qna question = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));

        // 답변 행 생성 (qnaLev = 1, parent_id = qnaId, group_id = 질문의 group_id)
        Qna answer = Qna.builder()
                .parentId(qnaId)
                .qnaTitle(request.getQnaTitle())
                .userId(adminUserId)
                .qnaCtnt(request.getQnaCtnt())
                .code(question.getCode())
                .groupId(question.getGroupId())
                .qnaLev(1)
                .build();

        // 질문 상태를 complete 로 변경
        question.updateStatus(QnaStatus.complete);

        Qna saved = qnaRepository.save(answer);

        // QnA 답변 등록 → 질문자 알림
        try {
            notificationService.notifyUser(
                question.getUserId(),
                NotificationType.QNA_ANSWERED.name(),
                "문의하신 QnA에 답변이 등록되었습니다.",
                adminUserId, TargetType.support, null, "/support/qna/" + qnaId
            );
        } catch (Exception e) {
            log.warn("[QNA][NOTIFY] answered qnaId={} reason={}", qnaId, e.getMessage());
        }

        return QnaResponse.from(saved);
    }

    @Override
    public QnaResponse updateAnswer(Integer qnaId, QnaAnswerRequest request) {
        Qna answer = qnaRepository.findByParentIdAndQnaLev(qnaId, 1)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        answer.updateAnswer(request.getQnaTitle(), request.getQnaCtnt());
        return QnaResponse.from(answer);
    }

    @Override
    public QnaResponse updateStatus(Integer qnaId, QnaStatusUpdateRequest request) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        qna.updateStatus(request.getQnaSt());
        return QnaResponse.from(qna);
    }

    private void ensureReadAccess(Qna qna, String requesterUserId, boolean isAdmin) {
        if (isAdmin) return;

        Qna ownerQuestion = resolveOwnerQuestion(qna);
        if (requesterUserId == null || !requesterUserId.equals(ownerQuestion.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private Qna resolveOwnerQuestion(Qna qna) {
        Integer level = qna.getQnaLev();
        if (level == null || level == 0 || qna.getParentId() == null) {
            return qna;
        }

        return qnaRepository.findById(qna.getParentId()).orElse(qna);
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

        if (mapped.startsWith("QNA_")) return mapped;

        return commonCodeRepository.existsByCode(mapped) ? mapped : DEFAULT_SUPPORT_CODE;
    }

    private String mapSupportCode(String rawCode) {
        String normalized = rawCode.trim().toUpperCase();

        return switch (normalized) {
            case "SUP_GENERAL", "GENERAL" -> "SUP_GENERAL";
            case "SUP_BILLING", "BILLING" -> "SUP_BILLING";
            case "QNA_CONTRACT", "QNA_PAYMENT", "QNA_FACILITY",
                 "QNA_ROOMSERVICE", "QNA_MOVEINOUT", "QNA_ETC" -> normalized;
            default -> {
                if (normalized.startsWith("QNA_")) yield normalized;
                yield normalized;
            }
        };
    }
}
