package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FindEmailRequest {

    @NotBlank(message = "이름을 입력해주세요.")
    private String userNm;

    @NotBlank(message = "전화번호를 입력해주세요.")
    private String userTel;
}
