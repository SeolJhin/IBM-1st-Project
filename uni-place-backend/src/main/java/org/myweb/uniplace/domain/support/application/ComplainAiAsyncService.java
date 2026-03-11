package org.myweb.uniplace.domain.support.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.domain.enums.ComplainImportance;
import org.myweb.uniplace.domain.support.infrastructure.ComplainAiClient;
import org.myweb.uniplace.domain.support.repository.ComplainRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 민원 AI 분류 비동기 서비스
 *
 * 별도 클래스로 분리한 이유:
 * @Async는 Spring AOP 기반이라 같은 클래스 내 자기호출(self-invocation)은
 * 프록시를 거치지 않아 비동기로 동작하지 않음.
 * → 별도 빈(Bean)으로 분리해야 @Async가 정상 동작함.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ComplainAiAsyncService {

    private final ComplainRepository  complainRepository;
    private final ComplainAiClient    complainAiClient;
    private final NotificationService notificationService;

    @Async
    @Transactional
    public void classifyAndNotify(Integer compId, String userId,
                                  String compTitle, String compCtnt) {
        try {
            // 1. AI 서버에 중요도 분류 요청
            ComplainAiClient.AiClassifyResult result =
                    complainAiClient.classify(compTitle, compCtnt);

            ComplainImportance importance = ComplainImportance.medium;
            String aiReason = "";

            if (result != null) {
                importance = result.importance();
                aiReason   = result.reason();
            }

            // 2. DB에 AI 분류 결과 저장
            Complain complain = complainRepository.findById(compId).orElse(null);
            if (complain != null) {
                complain.applyAiClassification(importance, aiReason);
                complainRepository.save(complain);
            }

            // 3. 관리자 알림 발송
            String notifyMessage = buildNotifyMessage(importance, compId, userId);
            String notifyType    = importance == ComplainImportance.high
                    ? NotificationType.COMP_URGENT.name()
                    : NotificationType.COMP_NEW.name();

            notificationService.notifyAdmins(
                    notifyType,
                    notifyMessage,
                    userId,
                    TargetType.support,
                    null,
                    "/admin/support/complain/" + compId
            );

            log.info("[COMP][AI] compId={} importance={} 분류 완료", compId, importance);

        } catch (Exception e) {
            log.warn("[COMP][AI] compId={} AI 분류/알림 실패: {}", compId, e.getMessage());

            try {
                notificationService.notifyAdmins(
                        NotificationType.COMP_NEW.name(),
                        "새 민원이 접수되었습니다. compId=" + compId + ", userId=" + userId,
                        userId,
                        TargetType.support,
                        null,
                        "/admin/support/complain/" + compId
                );
            } catch (Exception ex) {
                log.warn("[COMP][NOTIFY][ADMIN] compId={} 알림 실패: {}", compId, ex.getMessage());
            }
        }
    }

    private String buildNotifyMessage(ComplainImportance importance, Integer compId, String userId) {
        return switch (importance) {
            case high   -> "🚨 [긴급 민원] 즉각 확인이 필요한 민원이 접수되었습니다. compId=" + compId + ", userId=" + userId;
            case medium -> "📋 [일반 민원] 새 민원이 접수되었습니다. compId=" + compId + ", userId=" + userId;
            case low    -> "📝 [문의/건의] 새 민원이 접수되었습니다. compId=" + compId + ", userId=" + userId;
        };
    }
}