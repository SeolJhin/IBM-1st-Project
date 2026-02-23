// 경로: org/myweb/uniplace/domain/notification/application/NotificationFactory.java
package org.myweb.uniplace.domain.notification.application;

import org.myweb.uniplace.domain.notification.domain.entity.Notification;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.springframework.stereotype.Component;

@Component
public class NotificationFactory {

    public Notification create(String receiverId,
                               NotificationType code,
                               String message,
                               String senderId,
                               TargetType target,
                               Integer targetId,
                               String urlPath) {

        return Notification.builder()
                .receiverId(receiverId)
                .code(code)
                .message(message)
                .senderId(senderId)
                .target(target)
                .targetId(targetId)
                .urlPath(urlPath)
                .isRead("N")
                .build();
    }
}