package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.enums.QnaStatus;

@Getter
public class QnaUpdateRequest {

    @Size(max = 255)
    private String qnaTitle;

    @Size(max = 4000)
    private String qnaCtnt;

    /** 관리자 상태 변경용 */
    private QnaStatus qnaSt;
}

