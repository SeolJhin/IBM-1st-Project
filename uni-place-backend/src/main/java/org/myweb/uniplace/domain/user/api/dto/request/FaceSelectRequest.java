package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FaceSelectRequest {

    /** matchToken (얼굴 인식 단계에서 발급) */
    @NotEmpty
    private String matchToken;

    /** 선택한 userId */
    @NotEmpty
    private String userId;

    @NotEmpty
    private String deviceId;
}