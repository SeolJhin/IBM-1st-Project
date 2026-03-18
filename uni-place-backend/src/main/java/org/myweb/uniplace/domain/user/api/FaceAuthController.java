package org.myweb.uniplace.domain.user.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.FaceLoginRequest;
import org.myweb.uniplace.domain.user.api.dto.request.FaceRegisterRequest;
import org.myweb.uniplace.domain.user.api.dto.request.FaceSelectRequest;
import org.myweb.uniplace.domain.user.api.dto.response.FaceMatchResponse;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;
import org.myweb.uniplace.domain.user.application.FaceAuthService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth/face")
public class FaceAuthController {

    private final FaceAuthService faceAuthService;

    /** GET /api/auth/face/count — 등록된 벡터 수 조회 (로그인 필요) */
    @GetMapping("/count")
    public ApiResponse<Integer> count(@AuthenticationPrincipal AuthUser me) {
        if (me == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        return ApiResponse.ok(faceAuthService.getVectorCount(me.getUserId()));
    }

    /** POST /api/auth/face/register — 얼굴 등록/갱신 (로그인 필요) */
    @PostMapping("/register")
    public ApiResponse<Void> register(
        @AuthenticationPrincipal AuthUser me,
        @Valid @RequestBody FaceRegisterRequest req
    ) {
        if (me == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        faceAuthService.registerDescriptor(me.getUserId(), req.getDescriptor());
        return ApiResponse.ok();
    }

    /** POST /api/auth/face/match — 1단계: 얼굴 → 일치 계정 목록 반환 */
    @PostMapping("/match")
    public ApiResponse<FaceMatchResponse> match(
        @Valid @RequestBody FaceLoginRequest req
    ) {
        return ApiResponse.ok(faceAuthService.matchFace(req.getDescriptor()));
    }

    /** POST /api/auth/face/select — 2단계: 계정 선택 → JWT 발급 */
    @PostMapping("/select")
    public ApiResponse<UserTokenResponse> select(
        HttpServletRequest http,
        @Valid @RequestBody FaceSelectRequest req
    ) {
        return ApiResponse.ok(faceAuthService.selectAccount(
            req.getMatchToken(), req.getUserId(), req.getDeviceId(),
            http.getHeader("User-Agent"), extractIp(http)
        ));
    }

    /** POST /api/auth/face/login — 단일 계정 로그인 (하위 호환) */
    @PostMapping("/login")
    public ApiResponse<UserTokenResponse> login(
        HttpServletRequest http,
        @Valid @RequestBody FaceLoginRequest req
    ) {
        return ApiResponse.ok(
            faceAuthService.loginByFace(req.getDescriptor(), req.getDeviceId(),
                http.getHeader("User-Agent"), extractIp(http))
        );
    }

    /** DELETE /api/auth/face — 등록된 얼굴 삭제 (로그인 필요) */
    @DeleteMapping
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthUser me) {
        if (me == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        faceAuthService.deleteDescriptor(me.getUserId());
        return ApiResponse.ok();
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}