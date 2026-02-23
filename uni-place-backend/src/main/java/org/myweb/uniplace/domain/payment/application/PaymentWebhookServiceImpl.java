package org.myweb.uniplace.domain.payment.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntentStatus;
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentWebhookServiceImpl implements PaymentWebhookService {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentReconcileService paymentReconcileService;
    private final ObjectMapper objectMapper;

    @Override
    public void handleKakaoWebhook(String payload) {
        JsonNode root = readJson(payload);
        if (root == null) {
            return;
        }

        JsonNode data = root.path("data").isMissingNode() ? root : root.path("data");
        String merchantUid = firstText(data, "partner_order_id", "orderId", "merchant_uid");
        String providerRefId = firstText(data, "tid", "transaction_id", "providerRefId");
        ingestWebhook("KAKAO", payload, merchantUid, providerRefId);
    }

    @Override
    public void handleTossWebhook(String payload) {
        JsonNode root = readJson(payload);
        if (root == null) {
            return;
        }

        JsonNode data = root.path("data").isMissingNode() ? root : root.path("data");
        String merchantUid = firstText(data, "orderId", "order_id", "merchantUid");
        String providerRefId = firstText(data, "checkoutPaymentId", "checkout_payment_id", "providerRefId");
        ingestWebhook("TOSS", payload, merchantUid, providerRefId);
    }

    private void ingestWebhook(String provider, String payload, String merchantUid, String providerRefId) {
        Payment payment = findPayment(provider, merchantUid, providerRefId);
        if (payment == null) {
            return;
        }

        PaymentIntent intent = resolveIntent(payment.getPaymentId(), providerRefId);
        if (intent.getPaymentIntentId() == null) {
            intent.recordReturnedParams(payload);
            paymentIntentRepository.save(intent);
            return;
        }

        if (canTransitionToReturned(intent.getIntentSt())) {
            intent.markReturned(payload);
        } else {
            intent.recordReturnedParams(payload);
        }
        paymentIntentRepository.save(intent);
        try {
            paymentReconcileService.triggerFromWebhook(payment.getPaymentId());
        } catch (Exception e) {
            log.warn("[ALERT][WEBHOOK][RECONCILE] deferred reconcile failed paymentId={} reason={}",
                payment.getPaymentId(), trimMessage(e.getMessage()));
        }
    }

    private PaymentIntent resolveIntent(Integer paymentId, String providerRefId) {
        if (hasText(providerRefId)) {
            PaymentIntent existing = paymentIntentRepository
                .findByPaymentIdAndProviderRefId(paymentId, providerRefId)
                .orElse(null);
            if (existing != null) {
                return existing;
            }
        }

        PaymentIntent latest = paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(paymentId)
            .orElse(null);
        if (latest != null && !hasText(providerRefId)) {
            return latest;
        }

        return PaymentIntent.builder()
            .paymentId(paymentId)
            .intentSt(PaymentIntentStatus.RETURNED)
            .providerRefId(blankToNull(providerRefId))
            .returnedParamsJson(null)
            .build();
    }

    private Payment findPayment(String provider, String merchantUid, String providerRefId) {
        Payment payment = null;

        if (hasText(merchantUid)) {
            payment = paymentRepository.findByMerchantUid(merchantUid).orElse(null);
        }

        if (payment == null && hasText(providerRefId)) {
            PaymentIntent intent = paymentIntentRepository
                .findTopByProviderRefIdOrderByPaymentIntentIdDesc(providerRefId)
                .orElse(null);
            if (intent != null) {
                payment = paymentRepository.findById(intent.getPaymentId()).orElse(null);
            }
        }

        if (payment == null) {
            return null;
        }
        if (!hasText(payment.getProvider()) || !provider.equalsIgnoreCase(payment.getProvider())) {
            return null;
        }
        return payment;
    }

    private JsonNode readJson(String payload) {
        if (!hasText(payload)) {
            return null;
        }
        try {
            return objectMapper.readTree(payload);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static String firstText(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.path(field);
            if (!value.isMissingNode() && !value.isNull() && value.isValueNode()) {
                String text = value.asText();
                if (hasText(text)) {
                    return text;
                }
            }
        }
        return null;
    }

    private static boolean canTransitionToReturned(PaymentIntentStatus status) {
        if (status == null) {
            return true;
        }
        return status != PaymentIntentStatus.APPROVE_OK
            && status != PaymentIntentStatus.APPROVE_FAIL
            && status != PaymentIntentStatus.CANCELED;
    }

    private static String blankToNull(String value) {
        return hasText(value) ? value : null;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String trimMessage(String message) {
        if (!hasText(message)) {
            return "unknown";
        }
        return message.length() > 255 ? message.substring(0, 255) : message;
    }
}
