package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class FaqCreateRequest {

    @NotBlank
    @Size(max = 100)
    private String faqTitle;

    @NotBlank
    @Size(max = 3000)
    private String faqCtnt;

    @NotBlank
    @Size(max = 20)
    private String code;
}

