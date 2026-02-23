package org.myweb.uniplace.domain.support.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.support.api.dto.request.NoticeCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.NoticeSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.NoticeUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.NoticeResponse;
import org.myweb.uniplace.domain.support.domain.entity.Notice;
import org.myweb.uniplace.domain.support.repository.NoticeRepository;
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
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NoticeResponse> search(NoticeSearchRequest request, Pageable pageable) {
        Page<Notice> page = noticeRepository.search(
                request.getNoticeSt(),
                request.getCode(),
                request.getKeyword(),
                pageable
        );
        return PageResponse.of(page.map(NoticeResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public NoticeResponse get(Integer noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
        return NoticeResponse.from(notice);
    }

    @Override
    public NoticeResponse create(String userId, NoticeCreateRequest request) {
        Notice notice = Notice.builder()
                .noticeTitle(request.getNoticeTitle())
                .userId(userId)
                .noticeCtnt(request.getNoticeCtnt())
                .importance(request.getImportance())
                .impEndAt(request.getImpEndAt())
                .noticeSt(request.getNoticeSt())
                .code(request.getCode())
                .build();
        return NoticeResponse.from(noticeRepository.save(notice));
    }

    @Override
    public NoticeResponse update(Integer noticeId, NoticeUpdateRequest request) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
        notice.update(
                request.getNoticeTitle(),
                request.getNoticeCtnt(),
                request.getImportance(),
                request.getImpEndAt(),
                request.getNoticeSt(),
                request.getCode()
        );
        return NoticeResponse.from(notice);
    }

    @Override
    public void delete(Integer noticeId) {
        if (!noticeRepository.existsById(noticeId)) {
            throw new BusinessException(ErrorCode.NOTICE_NOT_FOUND);
        }
        noticeRepository.deleteById(noticeId);
    }
}
