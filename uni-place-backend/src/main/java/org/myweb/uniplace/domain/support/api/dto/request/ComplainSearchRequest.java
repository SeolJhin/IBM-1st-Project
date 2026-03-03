package org.myweb.uniplace.domain.support.api.dto.request;

import lombok.Getter;
import lombok.Setter;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;

@Getter
@Setter
public class ComplainSearchRequest {
    private String userId;
    private String code;
    private ComplainStatus compSt;
    private String keyword;
}
