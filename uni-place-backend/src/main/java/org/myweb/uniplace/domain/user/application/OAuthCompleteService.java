package org.myweb.uniplace.domain.user.application;

import org.myweb.uniplace.domain.user.api.dto.request.KakaoSignupCompleteRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;

public interface OAuthCompleteService {
	// 카카오 로그인 성공 후 “추가정보 입력 완료” 요청을 처리(회원 생성 + 소셜 연결 + 토큰 발급)
    UserTokenResponse kakaoComplete(KakaoSignupCompleteRequest req, String userAgent, String ip);
}
