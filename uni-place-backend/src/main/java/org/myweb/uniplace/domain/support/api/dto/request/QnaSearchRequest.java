package org.myweb.uniplace.domain.support.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.enums.QnaStatus;

@Getter
public class QnaSearchRequest {
    private String userId;
    private String code;
    private QnaStatus qnaSt;
    private String keyword;
}
