// 경로: org/myweb/uniplace/domain/notification/api/dto/response/NotificationResponse.java
package org.myweb.uniplace.domain.notification.api.dto.response;

import java.time.LocalDateTime;
import java.time.ZoneId;

import org.myweb.uniplace.domain.notification.domain.entity.Notification;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationResponse {

    // JDBC serverTimezone=Asia/Seoul → LocalDateTime은 KST 값
    private static final ZoneId DB_ZONE = ZoneId.of("Asia/Seoul");

    private Integer notificationId;
    private String receiverId;

    private String code;      // String code
    private String senderId;

    private String message;

    private String target;    // enum name
    private Integer targetId;
    private String urlPath;

    private String isRead;
    private Long isReadAtMs;
    private Long createdAtMs;

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
                .isReadAtMs(toEpochMs(n.getIsReadAt()))
                .createdAtMs(toEpochMs(n.getCreatedAt()))
                .build();
    }

    private static Long toEpochMs(LocalDateTime ldt) {
        if (ldt == null) return null;
        return ldt.atZone(DB_ZONE).toInstant().toEpochMilli();
    }
}