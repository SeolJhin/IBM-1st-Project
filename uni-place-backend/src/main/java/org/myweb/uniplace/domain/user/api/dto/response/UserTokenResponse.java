package org.myweb.uniplace.domain.user.api.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserTokenResponse {
    private String accessToken;
    private String refreshToken;
    private String deviceId;

    // ✅ first_sign 기반: 첫 로그인/추가정보 미완료면 true
    private boolean additionalInfoRequired;
}