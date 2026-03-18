package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FaceLoginRequest {

    /** 클라이언트에서 전송하는 128차원 descriptor (float 배열 JSON) */
    @NotEmpty
    private String descriptor;

    @NotEmpty
    @Size(max = 200)
    private String deviceId;
}