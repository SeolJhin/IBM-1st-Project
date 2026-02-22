package org.myweb.uniplace.domain.payment.api.webhook;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.payment.application.gateway.toss.TossProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private static final String HMAC_SHA256 = "HmacSHA256";

    private final TossProperties tossProperties;

    @PostMapping("/kakao")
    public void kakaoWebhook(@RequestBody String payload) {
        // TODO: add kakao webhook validation and update status
    }

    @PostMapping("/toss")
    public ResponseEntity<String> tossWebhook(
        @RequestBody String payload,
        @RequestHeader(value = "tosspayments-webhook-transmission-time", required = false) String transmissionTime,
        @RequestHeader(value = "tosspayments-webhook-signature", required = false) String signature
    ) {
        // 서명이 없는 이벤트는 통과 (payment/deposit/cancel 상태 웹훅)
        if (signature == null || signature.isBlank()) {
            return ResponseEntity.ok("OK");
        }

        if (transmissionTime == null || transmissionTime.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("missing transmission time");
        }

        String secret = tossProperties.getWebhook_secret();
        if (secret == null || secret.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("missing webhook secret");
        }

        String message = payload + ":" + transmissionTime;
        byte[] digest = hmacSha256(secret, message);

        for (byte[] sig : parseSignatures(signature)) {
            if (MessageDigest.isEqual(digest, sig)) {
                return ResponseEntity.ok("OK");
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid signature");
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
}
