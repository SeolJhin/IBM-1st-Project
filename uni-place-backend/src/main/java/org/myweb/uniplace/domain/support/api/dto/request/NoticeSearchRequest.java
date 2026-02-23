package org.myweb.uniplace.domain.support.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.enums.NoticeStatus;

@Getter
public class NoticeSearchRequest {
    private NoticeStatus noticeSt;
    private String code;
    private String keyword;
}
