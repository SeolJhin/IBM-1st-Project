package org.myweb.uniplace.domain.payment.api.webhook;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    @PostMapping("/kakao")
    public void kakaoWebhook(@RequestBody String payload) {
        // 추후 카카오 웹훅 검증 및 상태 업데이트 로직 추가
    }
}