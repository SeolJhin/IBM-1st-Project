package org.myweb.uniplace.domain.support.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainReplyRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.ComplainResponse;
import org.myweb.uniplace.domain.commoncode.repository.CommonCodeRepository;
import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.repository.ComplainRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ComplainServiceImpl implements ComplainService {

    private static final String DEFAULT_SUPPORT_CODE = "SUP_GENERAL";

    private final ComplainRepository complainRepository;
    private final CommonCodeRepository commonCodeRepository;

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
        return ComplainResponse.from(complainRepository.save(complain));
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

        return commonCodeRepository.existsByCode(mapped) ? mapped : DEFAULT_SUPPORT_CODE;
    }

    private String mapSupportCode(String rawCode) {
        String normalized = rawCode.trim().toUpperCase();

        return switch (normalized) {
            case "SUP_GENERAL", "GENERAL" -> "SUP_GENERAL";
            case "SUP_BILLING", "BILLING" -> "SUP_BILLING";
            default -> {
                if (normalized.startsWith("COMP_")) {
                    if (normalized.contains("BILL") || normalized.contains("PAY")) yield "SUP_BILLING";
                    yield "SUP_GENERAL";
                }
                yield normalized;
            }
        };
    }
}
