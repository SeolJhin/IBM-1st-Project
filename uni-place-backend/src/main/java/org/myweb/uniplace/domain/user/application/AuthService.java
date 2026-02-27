package org.myweb.uniplace.domain.user.application;

import org.myweb.uniplace.domain.user.api.dto.request.*;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;

public interface AuthService {
    void signup(UserSignupRequest req);
    UserTokenResponse login(UserLoginRequest req, String userAgent, String ip);
    UserTokenResponse refresh(RefreshTokenRequest req, String userAgent, String ip);
    void logout(LogoutRequest req);
    void logoutAll(String userId);
    
    // ✅ 카카오 소셜 로그인 "추가정보 입력 완료" 처리
    UserTokenResponse kakaoComplete(KakaoSignupCompleteRequest req, String userAgent, String ip);
    UserTokenResponse googleComplete(KakaoSignupCompleteRequest req, String userAgent, String ip);
}
