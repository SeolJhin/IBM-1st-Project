package org.myweb.uniplace.domain.payment.api.webhook;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.time.Instant;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.payment.application.PaymentWebhookService;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.KakaoPayProperties;
import org.myweb.uniplace.domain.payment.application.gateway.toss.TossProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final long MAX_SKEW_MILLIS = 300_000L;
    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookController.class);

    private final KakaoPayProperties kakaoPayProperties;
    private final TossProperties tossProperties;
    private final PaymentWebhookService paymentWebhookService;
    private final NotificationService notificationService;

    @PostMapping("/kakao")
    public ResponseEntity<String> kakaoWebhook(
        @RequestBody String payload,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestHeader(value = "X-Kakao-Resource-ID", required = false) String resourceId,
        @RequestHeader(value = "User-Agent", required = false) String userAgent
    ) {
        if (!isValidKakaoWebhook(authorization, resourceId, userAgent)) {
            log.warn("[SECURITY][ALERT][WEBHOOK] kakao webhook rejected resourceId={}", mask(resourceId));
            notifyWebhookFail(
                "KAKAO webhook 검증 실패 resourceId=" + mask(resourceId) + ", userAgent=" + userAgent
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid kakao webhook");
        }
        paymentWebhookService.handleKakaoWebhook(payload);
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/toss")
    public ResponseEntity<String> tossWebhook(
        @RequestBody String payload,
        @RequestHeader(value = "tosspayments-webhook-transmission-time", required = false) String transmissionTime,
        @RequestHeader(value = "tosspayments-webhook-signature", required = false) String signature
    ) {
        // 서명 없는 요청은 신뢰할 수 없으므로 거부
        if (signature == null || signature.isBlank()) {
            notifyWebhookFail("TOSS webhook 검증 실패 missing signature");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("missing signature");
        }

        if (transmissionTime == null || transmissionTime.isBlank()) {
            notifyWebhookFail("TOSS webhook 검증 실패 missing transmission time");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("missing transmission time");
        }
        if (!isFreshTransmissionTime(transmissionTime)) {
            log.warn("[SECURITY][ALERT][WEBHOOK] toss timestamp rejected transmissionTime={}", transmissionTime);
            notifyWebhookFail("TOSS webhook 검증 실패 stale transmission time=" + transmissionTime);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("stale transmission time");
        }

        String secret = tossProperties.getWebhook_secret();
        if (secret == null || secret.isBlank()) {
            notifyWebhookFail("TOSS webhook 검증 실패 missing webhook secret");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("missing webhook secret");
        }

        String message = payload + ":" + transmissionTime;
        byte[] digest = hmacSha256(secret, message);

        for (byte[] sig : parseSignatures(signature)) {
            if (MessageDigest.isEqual(digest, sig)) {
                paymentWebhookService.handleTossWebhook(payload);
                return ResponseEntity.ok("OK");
            }
        }

        log.warn("[SECURITY][ALERT][WEBHOOK] toss signature rejected transmissionTime={}", transmissionTime);
        notifyWebhookFail("TOSS webhook 검증 실패 invalid signature transmissionTime=" + transmissionTime);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid signature");
    }

    private void notifyWebhookFail(String message) {
        try {
            notificationService.notifyAdmins(
                NotificationType.PAY_WEBHOOK_FAIL.name(),
                message,
                null,
                TargetType.payment,
                null,
                "/admin/payments"
            );
        } catch (Exception e) {
            log.warn("[PAYMENT][NOTIFY][ADMIN] webhook fail notify error={}", e.getMessage());
        }
    }

    private boolean isValidKakaoWebhook(String authorization, String resourceId, String userAgent) {
        String adminKey = kakaoPayProperties.getWebhook_admin_key();
        if (adminKey == null || adminKey.isBlank()) {
            return false;
        }
        if (authorization == null || authorization.isBlank()) {
            return false;
        }
        if (resourceId == null || resourceId.isBlank()) {
            return false;
        }
        if (userAgent == null || !userAgent.startsWith("KakaoOpenAPI/")) {
            return false;
        }

        String expected = "KakaoAK " + adminKey;
        return MessageDigest.isEqual(
            expected.getBytes(StandardCharsets.UTF_8),
            authorization.getBytes(StandardCharsets.UTF_8)
        );
    }

    private static boolean isFreshTransmissionTime(String transmissionTime) {
        Long timestamp = parseEpochMillis(transmissionTime);
        if (timestamp == null) {
            return false;
        }
        long now = Instant.now().toEpochMilli();
        return Math.abs(now - timestamp) <= MAX_SKEW_MILLIS;
    }

    private static Long parseEpochMillis(String raw) {
        try {
            long parsed = Long.parseLong(raw.trim());
            if (raw.trim().length() <= 10) {
                return parsed * 1000L;
            }
            return parsed;
        } catch (Exception ignored) {
            return null;
        }
    }

    private static byte[] hmacSha256(String secret, String message) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            return mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC_SHA256 failed", e);
        }
    }

    private static List<byte[]> parseSignatures(String signatureHeader) {
        List<byte[]> result = new ArrayList<>();
        for (String part : signatureHeader.split(",")) {
            String trimmed = part.trim();
            int idx = trimmed.indexOf("v1:");
            if (idx == -1) {
                continue;
            }
            String b64 = trimmed.substring(idx + 3);
            try {
                result.add(Base64.getDecoder().decode(b64));
            } catch (IllegalArgumentException ignored) {
                // ignore invalid base64
            }
        }
        return result;
    }

    private static String mask(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        if (value.length() <= 4) {
            return "****";
        }
        return value.substring(0, 2) + "****" + value.substring(value.length() - 2);
    }
}
