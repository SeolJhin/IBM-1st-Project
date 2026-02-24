// 경로: org/myweb/uniplace/domain/notification/api/dto/response/NotificationResponse.java
package org.myweb.uniplace.domain.notification.api.dto.response;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.notification.domain.entity.Notification;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationResponse {

    private Integer notificationId;
    private String receiverId;

    private String code;      // String code
    private String senderId;

    private String message;

    private String target;    // enum name
    private Integer targetId;
    private String urlPath;

    private String isRead;
    private LocalDateTime isReadAt;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .receiverId(n.getReceiverId())
                .code(n.getCode())
                .senderId(n.getSenderId())
                .message(n.getMessage())
                .target(n.getTarget() != null ? n.getTarget().name() : null)
                .targetId(n.getTargetId())
                .urlPath(n.getUrlPath())
                .isRead(n.getIsRead())
                .isReadAt(n.getIsReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}