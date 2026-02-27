// 경로: org/myweb/uniplace/domain/notification/application/NotificationServiceImpl.java
// ✅ 변경사항: deleteRead() 메서드 구현 추가
package org.myweb.uniplace.domain.notification.application;

import java.util.List;

import org.myweb.uniplace.domain.notification.api.dto.response.NotificationListResponse;
import org.myweb.uniplace.domain.notification.api.dto.response.NotificationResponse;
import org.myweb.uniplace.domain.notification.domain.entity.Notification;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.notification.repository.NotificationRepository;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationFactory notificationFactory;

    @Override
    public NotificationListResponse my(String userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId, pageable);
        Page<NotificationResponse> mapped = page.map(NotificationResponse::from);

        long unread = notificationRepository.countByReceiverIdAndIsRead(userId, "N");
        return NotificationListResponse.of(PageResponse.of(mapped), unread);
    }

    @Override
    public NotificationListResponse myUnread(String userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByReceiverIdAndIsReadOrderByCreatedAtDesc(userId, "N", pageable);
        Page<NotificationResponse> mapped = page.map(NotificationResponse::from);

        long unread = notificationRepository.countByReceiverIdAndIsRead(userId, "N");
        return NotificationListResponse.of(PageResponse.of(mapped), unread);
    }

    @Override
    @Transactional
    public void markRead(String userId, Integer notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!userId.equals(n.getReceiverId())) {
            throw new BusinessException(ErrorCode.NOTIFICATION_ACCESS_DENIED);
        }

        n.markRead();
    }

    @Override
    @Transactional
    public int markAllRead(String userId) {
        return notificationRepository.markAllRead(userId);
    }

    // ✅ 추가: 읽은 알림 전체 삭제
    @Override
    @Transactional
    public int deleteRead(String userId) {
        return notificationRepository.deleteAllReadByReceiverId(userId);
    }

    @Override
    @Transactional
    public void notifyUser(String receiverId,
                           String code,
                           String message,
                           String senderId,
                           TargetType target,
                           Integer targetId,
                           String urlPath) {

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if ("Y".equalsIgnoreCase(receiver.getDeleteYN())) return;

        Notification n = notificationFactory.create(receiverId, code, message, senderId, target, targetId, urlPath);
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    public void notifyAdmins(String code,
                             String message,
                             String senderId,
                             TargetType target,
                             Integer targetId,
                             String urlPath) {

        List<User> admins = userRepository.findAllByUserRole(UserRole.admin);
        for (User admin : admins) {
            if ("Y".equalsIgnoreCase(admin.getDeleteYN())) continue;

            Notification n = notificationFactory.create(
                    admin.getUserId(),
                    code,
                    message,
                    senderId,
                    target,
                    targetId,
                    urlPath
            );
            notificationRepository.save(n);
        }
    }
}
