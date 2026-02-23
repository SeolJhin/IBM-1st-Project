package org.myweb.uniplace.domain.support.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.entity.Notice;
import org.myweb.uniplace.domain.support.domain.enums.NoticeStatus;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoticeResponse {

    private Integer noticeId;
    private String noticeTitle;
    private String userId;
    private String noticeCtnt;
    private String importance;
    private LocalDateTime impEndAt;
    private Integer readCount;
    private NoticeStatus noticeSt;
    private String fileCk;
    private String code;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoticeResponse from(Notice n) {
        return NoticeResponse.builder()
                .noticeId(n.getNoticeId())
                .noticeTitle(n.getNoticeTitle())
                .userId(n.getUserId())
                .noticeCtnt(n.getNoticeCtnt())
                .importance(n.getImportance())
                .impEndAt(n.getImpEndAt())
                .readCount(n.getReadCount())
                .noticeSt(n.getNoticeSt())
                .fileCk(n.getFileCk())
                .code(n.getCode())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}

