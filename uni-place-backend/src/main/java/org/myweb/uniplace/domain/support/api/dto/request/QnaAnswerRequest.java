package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class QnaAnswerRequest {

    @NotBlank
    @Size(max = 255)
    private String qnaTitle;

    @NotBlank
    @Size(max = 4000)
    private String qnaCtnt;
}
