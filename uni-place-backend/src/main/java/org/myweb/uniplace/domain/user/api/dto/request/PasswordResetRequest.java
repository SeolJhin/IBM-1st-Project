package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PasswordResetRequest {

    @NotBlank(message = "이메일을 입력해주세요.")
    private String userEmail;
}
