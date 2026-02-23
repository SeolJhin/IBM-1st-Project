package org.myweb.uniplace.domain.support.api.dto.request;

import lombok.Getter;

@Getter
public class FaqSearchRequest {
    private String code;
    private Integer isActive;
    private String keyword;
}
