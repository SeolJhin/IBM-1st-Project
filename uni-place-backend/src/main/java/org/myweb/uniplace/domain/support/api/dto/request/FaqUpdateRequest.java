package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class FaqUpdateRequest {

    @Size(max = 100)
    private String faqTitle;

    @Size(max = 3000)
    private String faqCtnt;

    @Size(max = 20)
    private String code;

    /** 활성/비활성 변경용 */
    private Boolean active;
}
