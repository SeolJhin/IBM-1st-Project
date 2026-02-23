package org.myweb.uniplace.domain.support.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.entity.Qna;
import org.myweb.uniplace.domain.support.domain.enums.QnaStatus;

import java.time.LocalDateTime;

@Getter
@Builder
public class QnaResponse {

    private Integer qnaId;
    private Integer parentId;
    private String qnaTitle;
    private String userId;
    private QnaStatus qnaSt;
    private Integer readCount;
    private String qnaCtnt;
    private String code;
    private String fileCk;
    private String replyCk;
    private Integer groupId;
    private Integer qnaLev;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static QnaResponse from(Qna q) {
        return QnaResponse.builder()
                .qnaId(q.getQnaId())
                .parentId(q.getParentId())
                .qnaTitle(q.getQnaTitle())
                .userId(q.getUserId())
                .qnaSt(q.getQnaSt())
                .readCount(q.getReadCount())
                .qnaCtnt(q.getQnaCtnt())
                .code(q.getCode())
                .fileCk(q.getFileCk())
                .replyCk(q.getReplyCk())
                .groupId(q.getGroupId())
                .qnaLev(q.getQnaLev())
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .build();
    }
}

