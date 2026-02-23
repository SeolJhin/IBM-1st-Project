package org.myweb.uniplace.domain.support.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.support.api.dto.request.FaqCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.FaqSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.FaqUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.FaqResponse;
import org.myweb.uniplace.domain.support.domain.entity.Faq;
import org.myweb.uniplace.domain.support.repository.FaqRepository;
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
public class FaqServiceImpl implements FaqService {

    private final FaqRepository faqRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FaqResponse> search(FaqSearchRequest request, Pageable pageable) {
        Page<Faq> page = faqRepository.search(
                request.getCode(),
                request.getIsActive(),
                request.getKeyword(),
                pageable
        );
        return PageResponse.of(page.map(FaqResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public FaqResponse get(Integer faqId) {
        Faq faq = faqRepository.findById(faqId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAQ_NOT_FOUND));
        return FaqResponse.from(faq);
    }

    @Override
    public FaqResponse create(FaqCreateRequest request) {
        Faq faq = Faq.builder()
                .faqTitle(request.getFaqTitle())
                .faqCtnt(request.getFaqCtnt())
                .code(request.getCode())
                .build();
        return FaqResponse.from(faqRepository.save(faq));
    }

    @Override
    public FaqResponse update(Integer faqId, FaqUpdateRequest request) {
        Faq faq = faqRepository.findById(faqId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAQ_NOT_FOUND));
        faq.update(request.getFaqTitle(), request.getFaqCtnt(), request.getCode());
        if (request.getActive() != null) {
            faq.changeActive(request.getActive());
        }
        return FaqResponse.from(faq);
    }

    @Override
    public void delete(Integer faqId) {
        if (!faqRepository.existsById(faqId)) {
            throw new BusinessException(ErrorCode.FAQ_NOT_FOUND);
        }
        faqRepository.deleteById(faqId);
    }
}
