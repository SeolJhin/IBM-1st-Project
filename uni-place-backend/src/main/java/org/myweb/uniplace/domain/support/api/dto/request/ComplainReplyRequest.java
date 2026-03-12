package org.myweb.uniplace.domain.support.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;

@Getter
public class ComplainReplyRequest {
    /** 답변 처리 후 변경할 상태 (기본 resolved) */
    private ComplainStatus compSt;

    /** 관리자 답변 내용 */
    private String replyCtnt;
}