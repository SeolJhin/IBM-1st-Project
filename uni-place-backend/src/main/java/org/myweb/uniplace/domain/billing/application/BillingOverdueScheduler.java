package org.myweb.uniplace.domain.billing.application;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.notification.application.NotificationFactory;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.notification.repository.NotificationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 월세 연체 자동 감지 + 알림 발송 스케줄러
 *
 * 매일 자정 실행:
 *   1. unpaid 청구 중 납부일이 지난 건 → overdue로 변경 + 연체 알림
 *   2. unpaid 청구 중 납부일 3일 전 → 미납 사전 알림
 *   3. unpaid 청구 중 납부일 당일 → 납부일 당일 알림
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BillingOverdueScheduler {

    private final MonthlyChargeRepository chargeRepository;
    private final ContractRepository contractRepository;
    private final NotificationFactory notificationFactory;
    private final NotificationRepository notificationRepository;

    private static final DateTimeFormatter YM_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void checkOverdueAndNotify() {
        LocalDate today = LocalDate.now();
        log.info("[BillingScheduler] 연체/미납 체크 시작: {}", today);

        List<MonthlyCharge> unpaidCharges = chargeRepository.findByChargeSt(MonthlyCharge.ST_UNPAID);
        int overdueCount = 0;
        int reminderCount = 0;

        for (MonthlyCharge charge : unpaidCharges) {
            Contract contract = contractRepository.findById(charge.getContractId()).orElse(null);
            if (contract == null || contract.getUser() == null) continue;

            LocalDate dueDate = calcDueDate(charge.getBillingDt(), contract.getPaymentDay());
            if (dueDate == null) continue;

            String userId = contract.getUser().getUserId();
            String monthLabel = charge.getBillingDt().replace("-", "년 ") + "월";

            // 납부일 지남 → overdue
            if (today.isAfter(dueDate)) {
                charge.markOverdue();
                chargeRepository.save(charge);
                overdueCount++;

                notificationRepository.save(notificationFactory.create(
                        userId,
                        "BILL_OVERDUE",
                        monthLabel + " 월세가 연체되었습니다. 빠른 납부 부탁드립니다.",
                        null,
                        TargetType.payment,
                        charge.getChargeId(),
                        "/me?tab=myroom&sub=rent-payment"
                ));
                log.info("[BillingScheduler] 연체 처리: chargeId={} userId={}", charge.getChargeId(), userId);
            }
            // 납부일 당일
            else if (today.isEqual(dueDate)) {
                notificationRepository.save(notificationFactory.create(
                        userId,
                        "BILL_DUE_TODAY",
                        "오늘은 " + monthLabel + " 월세 납부일입니다.",
                        null,
                        TargetType.payment,
                        charge.getChargeId(),
                        "/me?tab=myroom&sub=rent-payment"
                ));
                reminderCount++;
            }
            // 납부일 3일 전
            else if (today.isEqual(dueDate.minusDays(3))) {
                notificationRepository.save(notificationFactory.create(
                        userId,
                        "BILL_REMINDER",
                        monthLabel + " 월세 납부일이 3일 남았습니다.",
                        null,
                        TargetType.payment,
                        charge.getChargeId(),
                        "/me?tab=myroom&sub=rent-payment"
                ));
                reminderCount++;
            }
        }

        log.info("[BillingScheduler] 완료: 연체 {}건, 알림 {}건", overdueCount, reminderCount);
    }

    /**
     * billing_dt(YYYY-MM) + paymentDay → 납부 마감일 계산
     * 예: "2026-03" + 25 → 2026-03-25
     * 월 마지막 날 초과 시 해당 월 마지막 날로 조정 (예: 2월 31일 → 2월 28일)
     */
    private LocalDate calcDueDate(String billingDt, int paymentDay) {
        try {
            YearMonth ym = YearMonth.parse(billingDt, YM_FMT);
            int lastDay = ym.lengthOfMonth();
            int day = Math.min(paymentDay, lastDay);
            return ym.atDay(day);
        } catch (Exception e) {
            log.warn("[BillingScheduler] 날짜 파싱 실패: billingDt={} paymentDay={}", billingDt, paymentDay);
            return null;
        }
    }
}
