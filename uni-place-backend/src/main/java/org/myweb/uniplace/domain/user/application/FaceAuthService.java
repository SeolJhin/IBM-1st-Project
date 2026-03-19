package org.myweb.uniplace.domain.user.application;

import org.myweb.uniplace.domain.user.api.dto.response.FaceMatchResponse;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;

public interface FaceAuthService {
    /** 얼굴 descriptor 등록/갱신 (로그인 필요) */
    void registerDescriptor(String userId, String descriptorJson);

    /** 등록된 벡터 수 조회 (0 = 미등록) */
    int getVectorCount(String userId);

    /**
     * 1단계: 얼굴로 일치하는 계정 목록 반환
     * 단일 계정이면 바로 토큰 발급 (accounts가 비어 있고 token이 채워짐)
     * 복수 계정이면 matchToken + accounts 반환
     */
    FaceMatchResponse matchFace(String descriptorJson);

    /** 2단계: 계정 선택 후 JWT 발급 */
    UserTokenResponse selectAccount(String matchToken, String userId,
                                    String deviceId, String userAgent, String ip);

    /** @deprecated matchFace + selectAccount 로 대체 */
    UserTokenResponse loginByFace(String descriptorJson, String deviceId,
                                  String userAgent, String ip);

    /** 등록된 얼굴 삭제 (로그인 필요) */
    void deleteDescriptor(String userId);
}