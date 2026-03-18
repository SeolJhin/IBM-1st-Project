package org.myweb.uniplace.domain.user.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.user.api.dto.response.FaceMatchResponse;
import org.myweb.uniplace.domain.user.api.dto.response.FaceMatchResponse.FaceMatchedAccount;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;
import org.myweb.uniplace.domain.user.domain.entity.FaceDescriptor;
import org.myweb.uniplace.domain.user.domain.entity.FaceMatchToken;
import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.FaceDescriptorRepository;
import org.myweb.uniplace.domain.user.repository.FaceMatchTokenRepository;
import org.myweb.uniplace.domain.user.repository.RefreshTokenRepository;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.JwtProvider;
import org.myweb.uniplace.global.util.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaceAuthServiceImpl implements FaceAuthService {

    private static final double THRESHOLD = 0.37;
    private static final int LOCK_MINUTES = 10;

    private final FaceDescriptorRepository faceDescriptorRepository;
    private final FaceMatchTokenRepository faceMatchTokenRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;
    private final ObjectMapper objectMapper;

    @Value("${jwt.refresh-exp:86400000}")
    private long refreshExpMillis;

    @Value("${face.aes-key:UniPlaceFaceKey!!UniPlaceFaceKey!!}")
    private String aesKeyRaw;

    @Override
    @Transactional
    public void registerDescriptor(String userId, String descriptorJson) {
        validate128d(descriptorJson);
        String encrypted = aesEncrypt(descriptorJson);
        FaceDescriptor face = faceDescriptorRepository.findByUserId(userId).orElse(null);
        if (face == null) {
            face = FaceDescriptor.builder()
                .userId(userId)
                .descriptor(toJsonArray(List.of(encrypted)))
                .build();
        } else {
            List<String> existing = fromJsonArray(face.getDescriptor());
            existing.add(encrypted);
            if (existing.size() > FaceDescriptor.MAX_VECTORS) {
                existing = existing.subList(existing.size() - FaceDescriptor.MAX_VECTORS, existing.size());
            }
            face.updateDescriptor(toJsonArray(existing));
        }
        faceDescriptorRepository.save(face);
        log.info("[FACE_REGISTER] userId={} vectors={}", userId, fromJsonArray(face.getDescriptor()).size());
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
                List<String> vectors = fromJsonArray(fd.getDescriptor());
                double minDist = vectors.stream()
                    .mapToDouble(v -> euclidean(incoming, toDoubleArray(aesDecrypt(v))))
                    .min().orElse(Double.MAX_VALUE);
                log.info("[FACE_MATCH_DIST] userId={} dist={} vectors={}", fd.getUserId(), minDist, vectors.size());
                return new FaceDist(fd, minDist);
            })
            .filter(fd -> fd.dist() < THRESHOLD)
            .sorted(Comparator.comparingDouble(FaceDist::dist))
            .toList();

        if (candidates.isEmpty()) {
            all.stream().filter(fd -> !fd.isLocked())
                .min(Comparator.comparingDouble(fd ->
                    fromJsonArray(fd.getDescriptor()).stream()
                        .mapToDouble(v -> euclidean(incoming, toDoubleArray(aesDecrypt(v))))
                        .min().orElse(Double.MAX_VALUE)))
                .ifPresent(fd -> { fd.recordFailure(); faceDescriptorRepository.save(fd); });
            throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
        }

        List<FaceMatchedAccount> accounts = new ArrayList<>();
        List<String> userIds = new ArrayList<>();
        for (FaceDist fd : candidates) {
            String uid = fd.fd().getUserId();
            userRepository.findById(uid).ifPresent(user -> {
                if (!user.canLogin()) return;
                int confidence = (int) Math.round((1.0 - fd.dist() / THRESHOLD) * 100);
                if (confidence < 20) return;
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

        String matchToken = UUID.randomUUID().toString().replace("-", "");
        faceMatchTokenRepository.save(FaceMatchToken.builder()
            .token(matchToken)
            .userIds(toJsonArray(userIds))
            .expireAt(LocalDateTime.now().plusMinutes(10))
            .build());
        try { faceMatchTokenRepository.deleteExpiredTokens(LocalDateTime.now()); } catch (Exception ignored) {}

        log.info("[FACE_MATCH] matched={} accounts", accounts.size());
        return FaceMatchResponse.builder().accounts(accounts).matchToken(matchToken).build();
    }

    @Override
    @Transactional
    public UserTokenResponse selectAccount(String matchToken, String userId,
                                           String deviceId, String userAgent, String ip) {
        FaceMatchToken session = faceMatchTokenRepository.findByToken(matchToken)
            .orElseThrow(() -> new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED));
        if (session.isExpired()) {
            faceMatchTokenRepository.delete(session);
            throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
        }
        if (!fromJsonArray(session.getUserIds()).contains(userId))
            throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
        session.markUsed();
        faceMatchTokenRepository.save(session);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));
        if (!user.canLogin()) throw new BusinessException(ErrorCode.BAD_REQUEST);
        try { updateLastLoginAt(userId); } catch (Exception e) {
            log.warn("[FACE_SELECT] last_login_at 업데이트 실패: {}", e.getMessage());
        }
        return issueTokens(user, deviceId, userAgent, ip);
    }

    @Override
    @Transactional
    public UserTokenResponse loginByFace(String descriptorJson, String deviceId,
                                         String userAgent, String ip) {
        validate128d(descriptorJson);
        List<FaceDescriptor> all = faceDescriptorRepository.findAll();
        if (all.isEmpty()) throw new BusinessException(ErrorCode.FACE_NOT_REGISTERED);

        double[] incoming = toDoubleArray(descriptorJson);

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
            .sorted(Comparator.comparingDouble(FaceDist::dist))
            .toList();

        if (sorted.isEmpty()) throw new BusinessException(ErrorCode.FACE_ACCOUNT_LOCKED);

        FaceDist best = sorted.get(0);
        if (best.dist() >= THRESHOLD) {
            best.fd().recordFailure();
            faceDescriptorRepository.save(best.fd());
            log.warn("[FACE_LOGIN_FAIL] reason=THRESHOLD bestDist={}", best.dist());
            throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
        }
        if (sorted.size() > 1) {
            double margin = sorted.get(1).dist() - best.dist();
            if (margin < 0.05 && best.dist() > 0.45) {
                log.warn("[FACE_LOGIN_FAIL] reason=AMBIGUOUS bestDist={}", best.dist());
                throw new BusinessException(ErrorCode.FACE_NOT_RECOGNIZED);
            }
        }
        best.fd().resetFailure();
        faceDescriptorRepository.save(best.fd());

        User user = userRepository.findById(best.fd().getUserId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));
        if (!user.canLogin()) throw new BusinessException(ErrorCode.BAD_REQUEST);
        try { updateLastLoginAt(user.getUserId()); } catch (Exception e) {
            log.warn("[FACE_LOGIN] last_login_at 업데이트 실패: {}", e.getMessage());
        }
        log.info("[FACE_LOGIN_SUCCESS] userId={} dist={}", user.getUserId(), best.dist());
        return issueTokens(user, deviceId, userAgent, ip);
    }

    @Override
    @Transactional
    public void deleteDescriptor(String userId) {
        faceDescriptorRepository.findByUserId(userId)
            .ifPresent(faceDescriptorRepository::delete);
        log.info("[FACE_DELETE] userId={}", userId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateLastLoginAt(String userId) {
        userRepository.findById(userId).ifPresent(u -> {
            u.markLoginNow();
            userRepository.save(u);
        });
    }

    private UserTokenResponse issueTokens(User user, String deviceId, String userAgent, String ip) {
        String resolvedDeviceId = (deviceId != null && !deviceId.isBlank())
            ? deviceId : "face_" + user.getUserId();
        String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getUserRole().name());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshExpMillis / 1000);
        RefreshToken rt = RefreshToken.builder()
            .refreshTokenId(IdGenerator.generate("RTK"))
            .user(user)
            .tokenHash(sha256(refreshToken))
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

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        String maskedLocal = local.length() <= 2 ? local : local.substring(0, 2) + "*".repeat(local.length() - 2);
        int dotIdx = domain.lastIndexOf('.');
        String domainMain = dotIdx > 0 ? domain.substring(0, dotIdx) : domain;
        String domainSuffix = dotIdx > 0 ? domain.substring(dotIdx) : "";
        String maskedDomain = domainMain.length() <= 3 ? domainMain
            : domainMain.substring(0, 3) + "*".repeat(domainMain.length() - 3);
        return maskedLocal + "@" + maskedDomain + domainSuffix;
    }

    private String resolveDisplayName(User user) {
        if (user.getUserNickname() != null && !user.getUserNickname().isBlank())
            return user.getUserNickname();
        String nm = user.getUserNm();
        if (nm == null || nm.isBlank()) return "사용자";
        return nm.length() <= 2 ? nm : nm.substring(0, 2) + "*";
    }

    @SuppressWarnings("unchecked")
    private List<String> fromJsonArray(String json) {
        try {
            Object parsed = objectMapper.readValue(json, Object.class);
            if (parsed instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof String) {
                return new ArrayList<>((List<String>) list);
            }
        } catch (Exception ignored) {}
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
            if (toDoubleArray(json).length != 128)
                throw new IllegalArgumentException("descriptor must be 128-dim");
        } catch (BusinessException e) {
            throw e;
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

    private String aesEncrypt(String plain) {
        try {
            byte[] keyBytes = Arrays.copyOf(aesKeyRaw.getBytes(StandardCharsets.UTF_8), 32);
            byte[] iv = new byte[16];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new IvParameterSpec(iv));
            byte[] encrypted = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[16 + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, 16);
            System.arraycopy(encrypted, 0, combined, 16, encrypted.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Face encrypt failed", e);
        }
    }

    private String aesDecrypt(String base64) {
        try {
            byte[] keyBytes = Arrays.copyOf(aesKeyRaw.getBytes(StandardCharsets.UTF_8), 32);
            byte[] combined = Base64.getDecoder().decode(base64);
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(keyBytes, "AES"),
                new IvParameterSpec(Arrays.copyOfRange(combined, 0, 16)));
            return new String(cipher.doFinal(Arrays.copyOfRange(combined, 16, combined.length)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Face decrypt failed", e);
        }
    }

    private String sha256(String raw) {
        try {
            byte[] hash = java.security.MessageDigest.getInstance("SHA-256")
                .digest(raw.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}