package org.myweb.uniplace.domain.support.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.domain.enums.ComplainImportance;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;

import java.time.LocalDateTime;

@Getter
@Builder
public class ComplainResponse {

    private Integer compId;
    private String compTitle;
    private String userId;
    private String compCtnt;
    private ComplainStatus compSt;

    /**
     * AI 분류 중요도 - 관리자에게만 노출
     * high / medium / low / null(분류 전)
     */
    private ComplainImportance importance;

    /**
     * AI 판단 근거 - 관리자에게만 노출
     * 예: "누수+감전 위험 키워드 감지 → 긴급 처리 필요"
     */
    private String aiReason;

    private String code;
    private String fileCk;
    private String replyCk;

    /** 관리자 답변 내용 */
    private String replyCtnt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ComplainResponse from(Complain c) {
        return ComplainResponse.builder()
                .compId(c.getCompId())
                .compTitle(c.getCompTitle())
                .userId(c.getUserId())
                .compCtnt(c.getCompCtnt())
                .compSt(c.getCompSt())
                .importance(c.getImportance())
                .aiReason(c.getAiReason())
                .code(c.getCode())
                .fileCk(c.getFileCk())
                .replyCk(c.getReplyCk())
                .replyCtnt(c.getReplyCtnt())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}