package org.myweb.uniplace.domain.user.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.user.api.dto.response.FaceMatchResponse;
import org.myweb.uniplace.domain.user.api.dto.response.FaceMatchResponse.FaceMatchedAccount;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;
import org.myweb.uniplace.domain.user.domain.entity.FaceDescriptor;
import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.FaceDescriptorRepository;
import org.myweb.uniplace.domain.user.repository.RefreshTokenRepository;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.JwtProvider;
import org.myweb.uniplace.global.util.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaceAuthServiceImpl implements FaceAuthService {

    private static final double THRESHOLD    = 0.37;  // 본인 최대 0.35 / 타인 0.37↑
    private static final double MIN_CONFIDENCE_RATIO = 0.20;
    private static final int    LOCK_MINUTES = 10;

    // matchToken 임시 저장소 (10분 TTL) — 메모리 캐시
    // key: matchToken, value: 검증된 userId 목록
    private final Map<String, MatchSession> matchCache = new ConcurrentHashMap<>();

    private record MatchSession(List<String> userIds, LocalDateTime expireAt) {
        boolean isExpired() { return LocalDateTime.now().isAfter(expireAt); }
    }

    private final FaceDescriptorRepository faceDescriptorRepository;
    private final UserRepository           userRepository;
    private final RefreshTokenRepository   refreshTokenRepository;
    private final JwtProvider              jwtProvider;
    private final ObjectMapper             objectMapper;

    @Value("${jwt.refresh-exp:86400000}")
    private long refreshExpMillis;

    @Value("${face.aes-key:UniPlaceFaceKey!!UniPlaceFaceKey!!}")  // 32바이트
    private String aesKeyRaw;

    /* ═══════════════════════════════════════════════════════════
       얼굴 등록 / 갱신 (인증된 사용자만 호출)
    ═══════════════════════════════════════════════════════════ */
    @Override
    @Transactional
    public void registerDescriptor(String userId, String descriptorJson) {
        validate128d(descriptorJson);
        String encrypted = aesEncrypt(descriptorJson);

        FaceDescriptor face = faceDescriptorRepository.findByUserId(userId)
            .orElse(null);

        if (face == null) {
            // 최초 등록 — 배열 형태로 저장
            String arrayJson = toJsonArray(List.of(encrypted));
            face = FaceDescriptor.builder()
                .userId(userId)
                .descriptor(arrayJson)
                .build();
        } else {
            // 기존 벡터 목록에 추가 (최대 MAX_VECTORS개)
            List<String> existing = fromJsonArray(face.getDescriptor());
            existing.add(encrypted);
            if (existing.size() > FaceDescriptor.MAX_VECTORS) {
                existing = existing.subList(existing.size() - FaceDescriptor.MAX_VECTORS, existing.size());
            }
            face.updateDescriptor(toJsonArray(existing));
        }

        faceDescriptorRepository.save(face);
        log.info("[FACE_REGISTER] userId={} vectors={}", userId,
            fromJsonArray(face.getDescriptor()).size());
    }

    @Override
    public int getVectorCount(String userId) {
        return faceDescriptorRepository.findByUserId(userId)
            .map(fd -> fromJsonArray(fd.getDescriptor()).size())
            .orElse(0);
    }
   
    @Override
    @Transactional
    public FaceMatchResponse matchFace(String descriptorJson) {
        validate128d(descriptorJson);

        List<FaceDescriptor> all = faceDescriptorRepository.findAll();
        if (all.isEmpty()) throw new BusinessException(ErrorCode.FACE_NOT_REGISTERED);

        double[] incoming = toDoubleArray(descriptorJson);

        record FaceDist(FaceDescriptor fd, double dist) {}
        List<FaceDist> candidates = all.stream()
            .filter(fd -> !fd.isLocked())
            .map(fd -> {
                // 저장된 여러 벡터 중 가장 가까운 거리 사용
                List<String> vectors = fromJsonArray(fd.getDescriptor());
                double minDist = vectors.stream()
                    .mapToDouble(v -> euclidean(incoming, toDoubleArray(aesDecrypt(v))))
                    .min()
                    .orElse(Double.MAX_VALUE);
                log.info("[FACE_MATCH_DIST] userId={} dist={} vectors={}", fd.getUserId(), minDist, vectors.size());
                return new FaceDist(fd, minDist);
            })
            .filter(fd -> fd.dist() < THRESHOLD)
            .sorted(Comparator.comparingDouble(FaceDist::dist))
            .toList();

        if (candidates.isEmpty()) {
            // 가장 가까운 항목 실패 카운트 증가
            all.stream().filter(fd -> !fd.isLocked())
                .min(Comparator.comparingDouble(fd ->
                    euclidean(incoming, toDoubleArray(aesDecrypt(fd.getDescriptor())))))
                .ifPresent(fd -> { fd.recordFailure(); faceDescriptorRepository.save(fd); });
            throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
        }

        // 일치 계정의 User 정보 조회
        List<FaceMatchedAccount> accounts = new ArrayList<>();
        List<String> userIds = new ArrayList<>();

        for (FaceDist fd : candidates) {
            String uid = fd.fd().getUserId();
            userRepository.findById(uid).ifPresent(user -> {
                if (!user.canLogin()) return;
                int confidence = (int) Math.round((1.0 - fd.dist() / THRESHOLD) * 100);
                if (confidence < 20) return;  // 일치도 20% 미만만 제외
                accounts.add(FaceMatchedAccount.builder()
                    .userId(uid)
                    .maskedEmail(maskEmail(user.getUserEmail()))
                    .displayName(resolveDisplayName(user))
                    .confidence(Math.max(0, Math.min(100, confidence)))
                    .build());
                userIds.add(uid);
            });
        }

        if (accounts.isEmpty()) throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);

        // matchToken 발급 (10분 유효)
        String matchToken = UUID.randomUUID().toString().replace("-", "");
        matchCache.put(matchToken, new MatchSession(userIds, LocalDateTime.now().plusMinutes(10)));

        // 만료된 캐시 정리 (간단한 GC)
        matchCache.entrySet().removeIf(e -> e.getValue().isExpired());

        log.info("[FACE_MATCH] matched={} accounts", accounts.size());
        return FaceMatchResponse.builder()
            .accounts(accounts)
            .matchToken(matchToken)
            .build();
    }

    /* ═══════════════════════════════════════════════════════════
       2단계: 계정 선택 → JWT 발급
    ═══════════════════════════════════════════════════════════ */
    @Override
    @Transactional
    public UserTokenResponse selectAccount(String matchToken, String userId,
                                           String deviceId, String userAgent, String ip) {
        // matchToken 검증
        MatchSession session = matchCache.get(matchToken);
        if (session == null || session.isExpired()) {
            matchCache.remove(matchToken);
            throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
        }
        if (!session.userIds().contains(userId)) {
            throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
        }
        matchCache.remove(matchToken); // 1회용

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));
        if (!user.canLogin()) throw new BusinessException(ErrorCode.BAD_REQUEST);

        try { updateLastLoginAt(userId); } catch (Exception e) {
            log.warn("[FACE_SELECT] last_login_at 업데이트 실패: {}", e.getMessage());
        }

        return issueTokens(user, deviceId, userAgent, ip);
    }

    /* ═══════════════════════════════════════════════════════════
       얼굴 로그인 → JWT 발급 (단일 계정용 / 하위 호환)
    ═══════════════════════════════════════════════════════════ */
    @Override
    @Transactional
    public UserTokenResponse loginByFace(String descriptorJson, String deviceId,
                                         String userAgent, String ip) {
        validate128d(descriptorJson);

        List<FaceDescriptor> all = faceDescriptorRepository.findAll();
        if (all.isEmpty()) throw new BusinessException(ErrorCode.FACE_NOT_REGISTERED);

        double[] incoming = toDoubleArray(descriptorJson);

        // 모든 얼굴과 거리 계산 후 오름차순 정렬 (다중 벡터 중 최솟값 사용)
        record FaceDist(FaceDescriptor fd, double dist) {}
        List<FaceDist> sorted = all.stream()
            .filter(fd -> !fd.isLocked())
            .map(fd -> {
                List<String> vectors = fromJsonArray(fd.getDescriptor());
                double minDist = vectors.stream()
                    .mapToDouble(v -> euclidean(incoming, toDoubleArray(aesDecrypt(v))))
                    .min().orElse(Double.MAX_VALUE);
                return new FaceDist(fd, minDist);
            })
            .sorted(java.util.Comparator.comparingDouble(FaceDist::dist))
            .toList();

        // 잠금된 계정만 있는 경우
        if (sorted.isEmpty()) throw new BusinessException(ErrorCode.FACE_ACCOUNT_LOCKED);

        FaceDist best = sorted.get(0);

        // 1) 임계값(0.37) 초과 → 인식 실패
        if (best.dist() >= THRESHOLD) {
            best.fd().recordFailure();
            faceDescriptorRepository.save(best.fd());
            log.warn("[FACE_LOGIN_FAIL] reason=THRESHOLD bestDist={}", best.dist());
            throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
        }

        // 2) 모호함 판단 — 사실상 THRESHOLD 0.28이면 타인은 걸리지 않으므로 생략
        if (sorted.size() > 1) {
            double secondDist = sorted.get(1).dist();
            double margin = secondDist - best.dist();
            if (margin < 0.05 && best.dist() > 0.45) {
                log.warn("[FACE_LOGIN_FAIL] reason=AMBIGUOUS bestDist={} secondDist={} margin={}",
                    best.dist(), secondDist, margin);
                throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
            }
        }

        FaceDescriptor matched = best.fd();
        matched.resetFailure();
        faceDescriptorRepository.save(matched);

        User user = userRepository.findById(matched.getUserId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        if (!user.canLogin()) throw new BusinessException(ErrorCode.BAD_REQUEST);

        // markLoginNow는 별도 트랜잭션으로 분리 → Deadlock 방지
        // 실패해도 로그인 자체는 성공 처리
        try {
            updateLastLoginAt(matched.getUserId());
        } catch (Exception e) {
            log.warn("[FACE_LOGIN] last_login_at 업데이트 실패 (무시): {}", e.getMessage());
        }

        log.info("[FACE_LOGIN_SUCCESS] userId={} dist={}", user.getUserId(), best.dist());
        return issueTokens(user, deviceId, userAgent, ip);
    }

    /* ═══════════════════════════════════════════════════════════
       얼굴 삭제
    ═══════════════════════════════════════════════════════════ */
    @Override
    @Transactional
    public void deleteDescriptor(String userId) {
        faceDescriptorRepository.findByUserId(userId)
            .ifPresent(faceDescriptorRepository::delete);
        log.info("[FACE_DELETE] userId={}", userId);
    }

    /* ═══════════════════════════════════════════════════════════
       유틸
    ═══════════════════════════════════════════════════════════ */

    /**
     * last_login_at 만 업데이트 — 별도 트랜잭션으로 분리
     * Deadlock 발생 시 메인 로그인 트랜잭션에 영향 없도록 격리
     */
    @org.springframework.transaction.annotation.Transactional(
        propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW
    )
    public void updateLastLoginAt(String userId) {
        userRepository.findById(userId).ifPresent(u -> {
            u.markLoginNow();
            userRepository.save(u);
        });
    }

    /* ── JWT 발급 공통 ── */
    private UserTokenResponse issueTokens(User user, String deviceId, String userAgent, String ip) {
        String resolvedDeviceId = (deviceId != null && !deviceId.isBlank())
            ? deviceId : "face_" + user.getUserId();
        String accessToken  = jwtProvider.createAccessToken(user.getUserId(), user.getUserRole().name());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());
        String tokenHash    = sha256(refreshToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshExpMillis / 1000);
        RefreshToken rt = RefreshToken.builder()
            .refreshTokenId(IdGenerator.generate("RTK"))
            .user(user)
            .tokenHash(tokenHash)
            .deviceId(resolvedDeviceId)
            .userAgent(userAgent != null ? userAgent : "face-login")
            .ip(ip != null ? ip : "unknown")
            .expiresAt(expiresAt)
            .revoked(false)
            .lastUsedAt(LocalDateTime.now())
            .build();
        refreshTokenRepository.save(rt);
        return UserTokenResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .deviceId(resolvedDeviceId)
            .additionalInfoRequired(user.isAdditionalInfoRequired())
            .build();
    }

    /* ── 이메일 마스킹: test@example.com → te**@exa***.com ── */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@", 2);
        String local  = parts[0];
        String domain = parts[1];
        String maskedLocal  = local.length() <= 2  ? local  : local.substring(0, 2)  + "*".repeat(local.length()  - 2);
        int    dotIdx = domain.lastIndexOf('.');
        String domainMain   = dotIdx > 0 ? domain.substring(0, dotIdx) : domain;
        String domainSuffix = dotIdx > 0 ? domain.substring(dotIdx)    : "";
        String maskedDomain = domainMain.length() <= 3 ? domainMain
            : domainMain.substring(0, 3) + "*".repeat(domainMain.length() - 3);
        return maskedLocal + "@" + maskedDomain + domainSuffix;
    }

    /* ── 표시 이름: 닉네임 우선, 없으면 이름 앞 2글자 ── */
    private String resolveDisplayName(User user) {
        if (user.getUserNickname() != null && !user.getUserNickname().isBlank())
            return user.getUserNickname();
        String nm = user.getUserNm();
        if (nm == null || nm.isBlank()) return "사용자";
        return nm.length() <= 2 ? nm : nm.substring(0, 2) + "*";
    }

    /* ── 다중 벡터 JSON 배열 처리 ── */
    @SuppressWarnings("unchecked")
    private List<String> fromJsonArray(String json) {
        try {
            Object parsed = objectMapper.readValue(json, Object.class);
            if (parsed instanceof List<?> list) {
                // 새 형식: ["암호화문자열1", "암호화문자열2", ...]
                if (!list.isEmpty() && list.get(0) instanceof String) {
                    return new ArrayList<>((List<String>) list);
                }
            }
        } catch (Exception ignored) {}
        // 구 형식(단일 암호화 문자열) → 리스트로 변환
        return new ArrayList<>(List.of(json));
    }

    private String toJsonArray(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            throw new RuntimeException("toJsonArray failed", e);
        }
    }

    private void validate128d(String json) {
        try {
            double[] arr = toDoubleArray(json);
            if (arr.length != 128) throw new IllegalArgumentException("descriptor must be 128-dim");
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
    }

    private double[] toDoubleArray(String json) {
        try {
            List<Double> list = objectMapper.readValue(json, new TypeReference<>() {});
            return list.stream().mapToDouble(Double::doubleValue).toArray();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
    }

    private double euclidean(double[] a, double[] b) {
        double sum = 0;
        for (int i = 0; i < a.length; i++) sum += Math.pow(a[i] - b[i], 2);
        return Math.sqrt(sum);
    }

    /* AES-256-CBC 암호화 */
    private String aesEncrypt(String plain) {
        try {
            byte[] keyBytes = aesKeyRaw.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) keyBytes = java.util.Arrays.copyOf(keyBytes, 32);
            SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");

            byte[] iv = new byte[16];
            new SecureRandom().nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);
            byte[] encrypted = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));

            // IV + 암호문을 합쳐서 Base64
            byte[] combined = new byte[16 + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, 16);
            System.arraycopy(encrypted, 0, combined, 16, encrypted.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Face encrypt failed", e);
        }
    }

    /* AES-256-CBC 복호화 */
    private String aesDecrypt(String base64) {
        try {
            byte[] keyBytes = aesKeyRaw.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) keyBytes = java.util.Arrays.copyOf(keyBytes, 32);
            SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");

            byte[] combined  = Base64.getDecoder().decode(base64);
            byte[] iv        = java.util.Arrays.copyOfRange(combined, 0, 16);
            byte[] encrypted = java.util.Arrays.copyOfRange(combined, 16, combined.length);

            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, key, new IvParameterSpec(iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Face decrypt failed", e);
        }
    }

    private String sha256(String raw) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}