package org.myweb.uniplace.domain.support.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commoncode.repository.CommonCodeRepository;
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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class QnaServiceImpl implements QnaService {

    private static final String DEFAULT_SUPPORT_CODE = "SUP_GENERAL";

    private final QnaRepository qnaRepository;
    private final CommonCodeRepository commonCodeRepository;

    // ────────────────────────── 조회 ──────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<QnaResponse> search(QnaSearchRequest request, Pageable pageable) {
        String normalizedCode = normalizeSupportCodeForFilter(request.getCode());
        Page<Qna> page = qnaRepository.search(
                request.getUserId(),
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
    public QnaResponse get(Integer qnaId) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        return QnaResponse.from(qna);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QnaResponse> getReplies(Integer qnaId) {
        if (!qnaRepository.existsById(qnaId)) {
            throw new BusinessException(ErrorCode.QNA_NOT_FOUND);
        }
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
                .qnaTitle(request.getQnaTitle())
                .userId(userId)
                .qnaCtnt(request.getQnaCtnt())
                .code(normalizeSupportCodeForWrite(request.getCode()))
                .groupId(request.getGroupId())
                .qnaLev(request.getQnaLev() != null ? request.getQnaLev() : 0)
                .build();
        return QnaResponse.from(qnaRepository.save(qna));
    }

    @Override
    public QnaResponse update(Integer qnaId, QnaUpdateRequest request) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        qna.update(request.getQnaTitle(), request.getQnaCtnt());
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

        return QnaResponse.from(qnaRepository.save(answer));
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

        return commonCodeRepository.existsByCode(mapped) ? mapped : DEFAULT_SUPPORT_CODE;
    }

    private String mapSupportCode(String rawCode) {
        String normalized = rawCode.trim().toUpperCase();

        return switch (normalized) {
            case "SUP_GENERAL", "GENERAL" -> "SUP_GENERAL";
            case "SUP_BILLING", "BILLING" -> "SUP_BILLING";
            default -> {
                if (normalized.startsWith("QNA_")) {
                    if (normalized.contains("PAY") || normalized.contains("BILL")) yield "SUP_BILLING";
                    yield "SUP_GENERAL";
                }
                yield normalized;
            }
        };
    }
}
