package org.myweb.uniplace.domain.payment.application;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentAttempt;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.repository.PaymentAttemptRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.KakaoPayClient;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.KakaoPayProperties;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoOrderRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoOrderResponse;
import org.myweb.uniplace.domain.payment.application.gateway.naver.NaverPayClient;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverHistoryByPaymentRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverHistoryResponse;
import org.myweb.uniplace.domain.payment.application.gateway.toss.TossClient;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentReconcileService {

    private static final Logger log = LoggerFactory.getLogger(PaymentReconcileService.class);

    private static final String ST_READY = "ready";
    private static final String ST_PENDING = "pending";
    private static final String ST_PAID = "paid";
    private static final String ST_CANCELLED = "cancelled";
    private static final String ST_DISPUTED = "disputed";

    private static final String TARGET_TYPE_ORDER = "order";
    private static final String TARGET_TYPE_MONTHLY_CHARGE = "monthly_charge";

    private final PaymentRepository paymentRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final PaymentAttemptService paymentAttemptService;
    private final OrderRepository orderRepository;
    private final MonthlyChargeRepository monthlyChargeRepository;
    private final TossClient tossClient;
    private final KakaoPayClient kakaoPayClient;
    private final KakaoPayProperties kakaoPayProperties;
    private final NaverPayClient naverPayClient;
    private final NotificationService notificationService;

    @Value("${payment.reconcile.enabled:true}")
    private boolean reconcileEnabled;

    @Value("${payment.reconcile.max-attempts:5}")
    private int maxAttempts;

    @Value("${payment.reconcile.backoff-seconds:30,60,120,300,600}")
    private String backoffSecondsSpec;

    public void triggerFromWebhook(Integer paymentId) {
        if (!reconcileEnabled || paymentId == null) {
            return;
        }

        Payment payment = paymentRepository.findById(paymentId).orElse(null);
        if (payment == null || isTerminal(payment.getPaymentSt())) {
            return;
        }

        if (ST_READY.equalsIgnoreCase(payment.getPaymentSt())) {
            payment.markPending();
            paymentRepository.save(payment);
        }

        reconcileOne(payment, true);
    }

    @Scheduled(fixedDelayString = "${payment.reconcile.poll-fixed-delay-ms:60000}")
    public void reconcilePendingPayments() {
        if (!reconcileEnabled) {
            return;
        }

        List<Payment> candidates = paymentRepository.findTop200ByPaymentStInOrderByPaymentIdAsc(
            List.of(ST_PENDING, ST_READY)
        );

        for (Payment payment : candidates) {
            try {
                reconcileOne(payment, false);
            } catch (Exception e) {
                log.warn("[ALERT][PAYMENT_RECONCILE] reconcile failed paymentId={} reason={}",
                    payment.getPaymentId(), trimMessageKor(e.getMessage()));
                notifyAdmins(
                    NotificationType.PAY_BATCH_FAIL.name(),
                    "결제 배치(reconcile) 실패. paymentId=" + payment.getPaymentId()
                        + ", provider=" + payment.getProvider()
                        + ", reason=" + trimMessageKor(e.getMessage()),
                    payment.getUserId(),
                    payment.getPaymentId(),
                    "/admin/payments/" + payment.getPaymentId()
                );
            }
        }
    }

    private void reconcileOne(Payment payment, boolean force) {
        if (payment == null || isTerminal(payment.getPaymentSt())) {
            return;
        }

        int requestedCount = toInt(paymentAttemptRepository.countByPaymentIdAndAttemptSt(
            payment.getPaymentId(),
            PaymentAttempt.AttemptSt.requested
        ));

        if (requestedCount >= maxAttempts) {
            markDisputed(payment, "MAX_RETRY_REACHED");
            return;
        }

        if (!force && !isBackoffElapsed(payment, requestedCount)) {
            return;
        }

        if (!ST_PENDING.equalsIgnoreCase(payment.getPaymentSt())) {
            payment.markPending();
            paymentRepository.save(payment);
        }

        paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.requested);
        int nextRequestedCount = requestedCount + 1;

        if ("TOSS".equalsIgnoreCase(payment.getProvider())) {
            reconcileToss(payment, nextRequestedCount);
            return;
        }
        if ("NAVER".equalsIgnoreCase(payment.getProvider())) {
            reconcileNaver(payment, nextRequestedCount);
            return;
        }

        if ("KAKAO".equalsIgnoreCase(payment.getProvider())) {
            reconcileKakao(payment, nextRequestedCount);
            return;
        }

        handleUnresolved(payment, nextRequestedCount, "UNSUPPORTED_PROVIDER_REQUERY");
    }

    private void reconcileToss(Payment payment, int requestedCount) {
        JsonNode payload;
        try {
            payload = tossClient.getByOrderId(payment.getMerchantUid());
        } catch (Exception e) {
            handleUnresolved(payment, requestedCount, "TOSS_QUERY_ERROR");
            return;
        }

        if (payload == null || payload.isNull()) {
            handleUnresolved(payment, requestedCount, "TOSS_QUERY_EMPTY");
            return;
        }

        String status = firstNonBlank(text(payload, "payStatus"), text(payload, "status"));
        if (!hasText(status)) {
            handleUnresolved(payment, requestedCount, "TOSS_STATUS_EMPTY");
            return;
        }

        String normalized = status.trim().toUpperCase();
        if (isApprovedStatus(normalized)) {
            String orderId = firstNonBlank(text(payload, "orderNo"), text(payload, "orderId"));
            String paymentKey = firstNonBlank(text(payload, "payToken"), text(payload, "paymentKey"));
            String currency = text(payload, "currency");
            BigDecimal captured = firstNonNull(decimal(payload, "amount"), decimal(payload, "totalAmount"));

            if (!hasText(paymentKey)
                || (hasText(orderId) && !payment.getMerchantUid().equals(orderId))
                || (captured != null && payment.getTotalPrice() != null && payment.getTotalPrice().compareTo(captured) != 0)
                || (hasText(currency) && hasText(payment.getCurrency())
                    && !payment.getCurrency().equalsIgnoreCase(currency))) {
                markDisputed(payment, "TOSS_APPROVE_MISMATCH");
                paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
                return;
            }

            if (hasText(payment.getProviderPaymentId()) && !payment.getProviderPaymentId().equals(paymentKey)) {
                markDisputed(payment, "PROVIDER_PAYMENT_ID_MISMATCH");
                paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
                return;
            }

            payment.updateProviderPaymentId(paymentKey);
            payment.markPaid(LocalDateTime.now(), captured == null ? payment.getTotalPrice() : captured);
            paymentRepository.save(payment);
            syncTargetPaid(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.approved);
            return;
        }

        if (isCanceledStatus(normalized)) {
            payment.markCanceled();
            paymentRepository.save(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
            return;
        }

        handleUnresolved(payment, requestedCount, "TOSS_STATUS_" + normalized);
    }

    private void reconcileNaver(Payment payment, int requestedCount) {
        if (!hasText(payment.getProviderPaymentId())) {
            handleUnresolved(payment, requestedCount, "NAVER_PAYMENT_ID_EMPTY");
            return;
        }

        NaverHistoryResponse payload;
        try {
            payload = naverPayClient.getHistoryByPaymentId(
                payment.getProviderPaymentId(),
                NaverHistoryByPaymentRequest.builder()
                    .approvalType("ALL")
                    .pageNumber(1)
                    .rowsPerPage(50)
                    .build()
            );
        } catch (Exception e) {
            handleUnresolved(payment, requestedCount, "NAVER_QUERY_ERROR");
            return;
        }

        if (payload == null || !hasText(payload.getCode()) || !"Success".equalsIgnoreCase(payload.getCode())) {
            handleUnresolved(payment, requestedCount, "NAVER_QUERY_EMPTY");
            return;
        }

        NaverHistoryResponse.HistoryItem approval = findLatestHistory(payload, "01");
        if (approval != null && "SUCCESS".equalsIgnoreCase(approval.getAdmissionState())) {
            if (!matchesNaverApproval(payment, approval)) {
                markDisputed(payment, "NAVER_APPROVE_MISMATCH");
                paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
                return;
            }

            payment.markPaid(LocalDateTime.now(), payment.getTotalPrice());
            paymentRepository.save(payment);
            syncTargetPaid(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.approved);
            return;
        }

        NaverHistoryResponse.HistoryItem cancel = findLatestHistory(payload, "03", "04");
        if (cancel != null && "SUCCESS".equalsIgnoreCase(cancel.getAdmissionState())) {
            payment.markCanceled();
            paymentRepository.save(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
            return;
        }

        handleUnresolved(payment, requestedCount, "NAVER_STATUS_UNRESOLVED");
    }

    private void reconcileKakao(Payment payment, int requestedCount) {
        String tid = resolveKakaoTid(payment);
        if (!hasText(tid)) {
            handleUnresolved(payment, requestedCount, "KAKAO_TID_EMPTY");
            return;
        }

        KakaoOrderResponse payload;
        try {
            payload = kakaoPayClient.order(
                KakaoOrderRequest.builder()
                    .cid(kakaoPayProperties.getCid())
                    .cid_secret(kakaoPayProperties.getCid_secret())
                    .tid(tid)
                    .build()
            );
        } catch (Exception e) {
            handleUnresolved(payment, requestedCount, "KAKAO_QUERY_ERROR");
            return;
        }

        if (payload == null || !hasText(payload.getStatus())) {
            handleUnresolved(payment, requestedCount, "KAKAO_STATUS_EMPTY");
            return;
        }

        String normalized = payload.getStatus().trim().toUpperCase();
        if (isKakaoApprovedStatus(normalized)) {
            if (!matchesKakaoApproval(payment, payload, tid)) {
                markDisputed(payment, "KAKAO_APPROVE_MISMATCH");
                paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
                return;
            }

            payment.updateProviderPaymentId(tid);
            BigDecimal captured = payload.getAmount() != null && payload.getAmount().getTotal() != null
                ? BigDecimal.valueOf(payload.getAmount().getTotal())
                : payment.getTotalPrice();
            payment.markPaid(LocalDateTime.now(), captured);
            paymentRepository.save(payment);
            syncTargetPaid(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.approved);
            return;
        }

        if (isCanceledStatus(normalized)) {
            payment.markCanceled();
            paymentRepository.save(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
            return;
        }

        handleUnresolved(payment, requestedCount, "KAKAO_STATUS_" + normalized);
    }

    private void handleUnresolved(Payment payment, int requestedCount, String reason) {
        paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
        if (requestedCount >= maxAttempts) {
            markDisputed(payment, reason);
            return;
        }
        payment.markPending();
        paymentRepository.save(payment);
    }

    private void syncTargetPaid(Payment payment) {
        if (payment.getTargetId() == null || !hasText(payment.getTargetType())) {
            return;
        }

        if (TARGET_TYPE_ORDER.equals(payment.getTargetType())) {
            Order order = orderRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
            if (order.getOrderSt() != OrderStatus.ordered) {
                return;
            }
            if (order.getPaymentId() != null && !Objects.equals(order.getPaymentId(), payment.getPaymentId())) {
                return;
            }
            order.completePayment(payment.getPaymentId());
            return;
        }

        if (TARGET_TYPE_MONTHLY_CHARGE.equals(payment.getTargetType())) {
            MonthlyCharge charge = monthlyChargeRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
            if (!MonthlyCharge.ST_UNPAID.equalsIgnoreCase(charge.getChargeSt())) {
                return;
            }
            if (charge.getPaymentId() != null && !Objects.equals(charge.getPaymentId(), payment.getPaymentId())) {
                return;
            }
            charge.markPaid(payment.getPaymentId());
        }
    }

    private void markDisputed(Payment payment, String reason) {
        payment.markDisputed();
        paymentRepository.save(payment);
        log.warn("[ALERT][PAYMENT_RECONCILE] disputed paymentId={} provider={} reason={}",
            payment.getPaymentId(), payment.getProvider(), reason);
        if (hasText(reason) && reason.contains("MISMATCH")) {
            notifyAdmins(
                NotificationType.PAY_STATUS_MISMATCH.name(),
                "결제 상태 불일치가 감지되어 분쟁 상태로 전환되었습니다. paymentId=" + payment.getPaymentId()
                    + ", provider=" + payment.getProvider()
                    + ", reason=" + reason,
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
        }
    }

    private boolean isBackoffElapsed(Payment payment, int requestedCount) {
        if (requestedCount <= 0) {
            return true;
        }

        PaymentAttempt last = paymentAttemptRepository.findTopByPaymentIdOrderByAttemptIdDesc(payment.getPaymentId());
        if (last == null || last.getFinishedAt() == null) {
            return true;
        }

        long delaySeconds = resolveBackoffSeconds(requestedCount);
        return last.getFinishedAt().plusSeconds(delaySeconds).isBefore(LocalDateTime.now());
    }

    private long resolveBackoffSeconds(int requestedCount) {
        List<Long> backoff = parseBackoffSeconds();
        if (backoff.isEmpty() || requestedCount <= 0) {
            return 0L;
        }
        int index = Math.min(backoff.size() - 1, Math.max(0, requestedCount - 1));
        return backoff.get(index);
    }

    private List<Long> parseBackoffSeconds() {
        List<Long> result = new ArrayList<>();
        if (!hasText(backoffSecondsSpec)) {
            return result;
        }

        String[] tokens = backoffSecondsSpec.split(",");
        for (String token : tokens) {
            try {
                long value = Long.parseLong(token.trim());
                if (value >= 0) {
                    result.add(value);
                }
            } catch (NumberFormatException ignored) {
                // skip invalid token
            }
        }
        return result;
    }

    private static boolean isTerminal(String paymentSt) {
        if (!hasText(paymentSt)) {
            return false;
        }
        String normalized = paymentSt.trim().toLowerCase();
        return ST_PAID.equals(normalized) || ST_CANCELLED.equals(normalized) || ST_DISPUTED.equals(normalized);
    }

    private static boolean isApprovedStatus(String normalizedStatus) {
        return "PAY_COMPLETE".equals(normalizedStatus)
            || "DONE".equals(normalizedStatus)
            || "PAID".equals(normalizedStatus)
            || "APPROVED".equals(normalizedStatus)
            || "SUCCESS".equals(normalizedStatus);
    }

    private static boolean isKakaoApprovedStatus(String normalizedStatus) {
        return isApprovedStatus(normalizedStatus)
            || "ACTIVE".equals(normalizedStatus)
            || "SUCCESS_PAYMENT".equals(normalizedStatus)
            || "PART_CANCEL_PAYMENT".equals(normalizedStatus);
    }

    private static boolean isCanceledStatus(String normalizedStatus) {
        return "PAY_CANCEL".equals(normalizedStatus)
            || "REFUND_SUCCESS".equals(normalizedStatus)
            || "CANCELED".equals(normalizedStatus)
            || "CANCELLED".equals(normalizedStatus)
            || "PARTIAL_CANCELED".equals(normalizedStatus)
            || "ABORTED".equals(normalizedStatus)
            || "EXPIRED".equals(normalizedStatus);
    }

    private static NaverHistoryResponse.HistoryItem findLatestHistory(NaverHistoryResponse payload, String... typeCodes) {
        if (payload == null || payload.getBody() == null || payload.getBody().getList() == null) {
            return null;
        }
        for (NaverHistoryResponse.HistoryItem item : payload.getBody().getList()) {
            if (item == null || !hasText(item.getAdmissionTypeCode())) {
                continue;
            }
            for (String typeCode : typeCodes) {
                if (typeCode.equals(item.getAdmissionTypeCode())) {
                    return item;
                }
            }
        }
        return null;
    }

    private static boolean matchesNaverApproval(Payment payment, NaverHistoryResponse.HistoryItem item) {
        if (payment == null || item == null) {
            return false;
        }
        if (!hasText(item.getPaymentId()) || !item.getPaymentId().equals(payment.getProviderPaymentId())) {
            return false;
        }
        if (!hasText(item.getMerchantPayKey()) || !item.getMerchantPayKey().equals(payment.getMerchantUid())) {
            return false;
        }
        if (item.getTotalPayAmount() == null || payment.getTotalPrice() == null) {
            return false;
        }
        return payment.getTotalPrice().compareTo(BigDecimal.valueOf(item.getTotalPayAmount())) == 0;
    }

    private String resolveKakaoTid(Payment payment) {
        if (payment == null) {
            return null;
        }
        if (hasText(payment.getProviderPaymentId())) {
            return payment.getProviderPaymentId();
        }
        PaymentIntent intent = paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(payment.getPaymentId())
            .orElse(null);
        if (intent == null || !hasText(intent.getProviderRefId())) {
            return null;
        }
        return intent.getProviderRefId();
    }

    private static boolean matchesKakaoApproval(Payment payment, KakaoOrderResponse payload, String tid) {
        if (payment == null || payload == null) {
            return false;
        }
        if (hasText(payload.getTid()) && !payload.getTid().equals(tid)) {
            return false;
        }
        if (hasText(payload.getPartnerOrderId()) && !payload.getPartnerOrderId().equals(payment.getMerchantUid())) {
            return false;
        }
        if (payload.getAmount() != null && payload.getAmount().getTotal() != null && payment.getTotalPrice() != null) {
            return payment.getTotalPrice().compareTo(BigDecimal.valueOf(payload.getAmount().getTotal())) == 0;
        }
        return true;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return hasText(text) ? text : null;
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        try {
            if (value.isNumber()) {
                return value.decimalValue();
            }
            if (value.isTextual() && hasText(value.asText())) {
                return new BigDecimal(value.asText());
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private static int toInt(long value) {
        if (value > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        if (value < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        return (int) value;
    }

    private static String trimMessage(String message) {
        if (!hasText(message)) {
            return "알 수 없음";
        }
        return message.length() > 255 ? message.substring(0, 255) : message;
    }

    private static String trimMessageKor(String message) {
        if (!hasText(message)) {
            return "알 수 없음";
        }
        return message.length() > 255 ? message.substring(0, 255) : message;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private static BigDecimal firstNonNull(BigDecimal first, BigDecimal second) {
        return first != null ? first : second;
    }

    private void notifyAdmins(String code, String message, String senderId, Integer paymentId, String urlPath) {
        try {
            notificationService.notifyAdmins(
                code,
                message,
                senderId,
                TargetType.payment,
                paymentId,
                urlPath
            );
        } catch (Exception e) {
            log.warn("[PAYMENT][NOTIFY][ADMIN] reconcile notify failed code={} paymentId={} reason={}",
                code, paymentId, trimMessageKor(e.getMessage()));
        }
    }
}
