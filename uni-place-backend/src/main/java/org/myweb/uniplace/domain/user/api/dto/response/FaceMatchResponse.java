package org.myweb.uniplace.domain.user.api.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FaceMatchResponse {

    /** 일치하는 계정 목록 */
    private List<FaceMatchedAccount> accounts;

    /** 매칭 세션 토큰 (계정 선택 시 재사용, 10분 유효) */
    private String matchToken;

    @Getter
    @Builder
    public static class FaceMatchedAccount {
        private String userId;
        /** 이메일 마스킹: te**@exam**.com */
        private String maskedEmail;
        /** 닉네임 (없으면 이름 앞 2글자) */
        private String displayName;
        /** 얼굴 일치 신뢰도 0~100 */
        private int confidence;
    }
}