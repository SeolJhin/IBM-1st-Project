package org.myweb.uniplace.domain.payment.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentAttempt;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentWebhookServiceImpl implements PaymentWebhookService {

    private static final String ST_PAID = "paid";
    private static final String ST_CANCELLED = "cancelled";

    private static final String TARGET_TYPE_ORDER = "order";
    private static final String TARGET_TYPE_MONTHLY_CHARGE = "monthly_charge";

    private final PaymentRepository paymentRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentAttemptService paymentAttemptService;
    private final OrderRepository orderRepository;
    private final MonthlyChargeRepository monthlyChargeRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void handleKakaoWebhook(String payload) {
        JsonNode root = readJson(payload);
        if (root == null) {
            return;
        }

        JsonNode data = root.path("data").isMissingNode() ? root : root.path("data");
        String status = normalizeStatus(firstText(
            data,
            "status",
            "payment_status",
            "eventType",
            "event_type"
        ));
        String merchantUid = firstText(data, "partner_order_id", "orderId", "merchant_uid");
        String providerRefId = firstText(data, "tid", "transaction_id", "providerRefId");

        Payment payment = findPayment("KAKAO", merchantUid, providerRefId);
        if (payment == null) {
            return;
        }

        applyStatus(payment, status, providerRefId, root.toString());
    }

    @Override
    public void handleTossWebhook(String payload) {
        JsonNode root = readJson(payload);
        if (root == null) {
            return;
        }

        JsonNode data = root.path("data").isMissingNode() ? root : root.path("data");
        String status = normalizeStatus(firstText(data, "status"));
        String merchantUid = firstText(data, "orderId", "order_id", "merchantUid");
        String providerPaymentId = firstText(data, "paymentKey", "payment_key", "paymentId");
        String providerRefId = firstText(data, "checkoutPaymentId", "checkout_payment_id", "providerRefId");

        Payment payment = findPayment("TOSS", merchantUid, providerRefId);
        if (payment == null) {
            return;
        }

        applyStatus(payment, status, providerPaymentId, root.toString());
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

    private void applyStatus(Payment payment, String status, String providerPaymentId, String rawPayload) {
        if (isPaidStatus(status)) {
            if (ST_PAID.equalsIgnoreCase(payment.getPaymentSt())) {
                return;
            }
            if (hasText(providerPaymentId)) {
                payment.updateProviderPaymentId(providerPaymentId);
            }
            payment.markPaid(LocalDateTime.now(), payment.getTotalPrice());
            paymentRepository.save(payment);
            markIntentApproveOk(payment.getPaymentId(), rawPayload);
            syncTargetPaid(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.approved);
            return;
        }

        if (isCanceledStatus(status)) {
            boolean wasPaid = ST_PAID.equalsIgnoreCase(payment.getPaymentSt());
            if (ST_CANCELLED.equalsIgnoreCase(payment.getPaymentSt())) {
                return;
            }

            payment.markCanceled();
            paymentRepository.save(payment);
            markIntentCanceled(payment.getPaymentId());

            if (wasPaid) {
                syncTargetCanceled(payment);
            } else {
                paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
            }
            return;
        }

        if (isFailedStatus(status)) {
            if (ST_PAID.equalsIgnoreCase(payment.getPaymentSt())) {
                return;
            }
            payment.markCanceled();
            paymentRepository.save(payment);
            markIntentApproveFail(payment.getPaymentId(), status, "webhook failed status", rawPayload);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
        }
    }

    private void markIntentApproveOk(Integer paymentId, String rawPayload) {
        paymentIntentRepository.findTopByPaymentIdOrderByPaymentIntentIdDesc(paymentId)
            .ifPresent(intent -> intent.markApproveOk(rawPayload));
    }

    private void markIntentCanceled(Integer paymentId) {
        paymentIntentRepository.findTopByPaymentIdOrderByPaymentIntentIdDesc(paymentId)
            .ifPresent(PaymentIntent::markCanceled);
    }

    private void markIntentApproveFail(Integer paymentId, String failCode, String failMessage, String rawPayload) {
        paymentIntentRepository.findTopByPaymentIdOrderByPaymentIntentIdDesc(paymentId)
            .ifPresent(intent -> intent.markApproveFail(failCode, trimMessage(failMessage), rawPayload));
    }

    private void syncTargetPaid(Payment payment) {
        if (payment.getTargetId() == null || !hasText(payment.getTargetType())) {
            return;
        }

        if (TARGET_TYPE_ORDER.equals(payment.getTargetType())) {
            Order order = orderRepository.findById(payment.getTargetId()).orElse(null);
            if (order == null || order.getOrderSt() != OrderStatus.ordered) {
                return;
            }
            if (order.getPaymentId() != null && !Objects.equals(order.getPaymentId(), payment.getPaymentId())) {
                return;
            }
            order.completePayment(payment.getPaymentId());
            return;
        }

        if (TARGET_TYPE_MONTHLY_CHARGE.equals(payment.getTargetType())) {
            MonthlyCharge charge = monthlyChargeRepository.findById(payment.getTargetId()).orElse(null);
            if (charge == null || !MonthlyCharge.ST_UNPAID.equalsIgnoreCase(charge.getChargeSt())) {
                return;
            }
            if (charge.getPaymentId() != null && !Objects.equals(charge.getPaymentId(), payment.getPaymentId())) {
                return;
            }
            charge.markPaid(payment.getPaymentId());
        }
    }

    private void syncTargetCanceled(Payment payment) {
        if (payment.getTargetId() == null || !hasText(payment.getTargetType())) {
            return;
        }

        if (TARGET_TYPE_ORDER.equals(payment.getTargetType())) {
            Order order = orderRepository.findById(payment.getTargetId()).orElse(null);
            if (order == null) {
                return;
            }
            order.markRefunded(payment.getPaymentId());
            return;
        }

        if (TARGET_TYPE_MONTHLY_CHARGE.equals(payment.getTargetType())) {
            MonthlyCharge charge = monthlyChargeRepository.findById(payment.getTargetId()).orElse(null);
            if (charge == null) {
                return;
            }
            charge.markUnpaid();
        }
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

    private static String normalizeStatus(String status) {
        return hasText(status) ? status.trim().toUpperCase() : "";
    }

    private static boolean isPaidStatus(String status) {
        return "DONE".equals(status)
            || "PAID".equals(status)
            || "SUCCESS".equals(status)
            || "APPROVED".equals(status)
            || "COMPLETED".equals(status)
            || "SUCCESS_PAYMENT".equals(status);
    }

    private static boolean isCanceledStatus(String status) {
        return "CANCELED".equals(status)
            || "CANCELLED".equals(status)
            || "PARTIAL_CANCELED".equals(status)
            || "PART_CANCEL_PAYMENT".equals(status)
            || "CANCEL_PAYMENT".equals(status)
            || "CANCEL".equals(status);
    }

    private static boolean isFailedStatus(String status) {
        return "FAILED".equals(status)
            || "ABORTED".equals(status)
            || "EXPIRED".equals(status)
            || "FAIL".equals(status)
            || "DENIED".equals(status)
            || "APPROVE_FAIL".equals(status)
            || "READY_FAIL".equals(status);
    }

    private static String trimMessage(String message) {
        if (!hasText(message)) {
            return "payment webhook failed";
        }
        return message.length() > 255 ? message.substring(0, 255) : message;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
