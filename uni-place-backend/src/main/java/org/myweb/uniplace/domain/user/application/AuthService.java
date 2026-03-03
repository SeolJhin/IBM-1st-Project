package org.myweb.uniplace.domain.user.application;

import org.myweb.uniplace.domain.user.api.dto.request.*;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;

public interface AuthService {
    void signup(UserSignupRequest req);
    UserTokenResponse login(UserLoginRequest req, String userAgent, String ip);
    UserTokenResponse refresh(RefreshTokenRequest req, String userAgent, String ip);
    void logout(LogoutRequest req);
    void logoutAll(String userId);

    UserTokenResponse kakaoComplete(KakaoSignupCompleteRequest req, String userAgent, String ip);
    UserTokenResponse googleComplete(KakaoSignupCompleteRequest req, String userAgent, String ip);

    // ===== 닉네임 중복 체크 =====
    /** 닉네임 사용 가능 여부 반환 (true = 사용 가능) */
    boolean checkNicknameAvailable(String nickname);

    // ===== 아이디 찾기 =====
    /** 이름 + 전화번호로 마스킹된 이메일 반환 */
    String findEmail(FindEmailRequest req);

    // ===== 비밀번호 재설정 =====
    /** 이메일로 재설정 링크 발송 */
    void requestPasswordReset(PasswordResetRequest req);

    /** 토큰 유효성 검증 (프론트 페이지 진입 시 사전 확인용) */
    void verifyPasswordResetToken(String token);

    /** 토큰 + 새 비밀번호로 비밀번호 변경 */
    void confirmPasswordReset(PasswordResetConfirmRequest req);
}
