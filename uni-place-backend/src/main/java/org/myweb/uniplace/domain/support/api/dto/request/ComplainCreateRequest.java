package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class ComplainCreateRequest {

    @NotBlank
    @Size(max = 300)
    private String compTitle;

    @Size(max = 3000)
    private String compCtnt;

    @NotBlank
    @Size(max = 20)
    private String code;
}

