package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FaceRegisterRequest {

    /** 128차원 descriptor (float 배열 JSON) */
    @NotEmpty
    private String descriptor;
}