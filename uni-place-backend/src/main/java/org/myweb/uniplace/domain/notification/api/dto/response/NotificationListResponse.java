// 경로: org/myweb/uniplace/domain/notification/api/dto/response/NotificationListResponse.java
package org.myweb.uniplace.domain.notification.api.dto.response;

import org.myweb.uniplace.global.response.PageResponse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationListResponse {

    private PageResponse<NotificationResponse> notifications;
    private long unreadCount;

    public static NotificationListResponse of(PageResponse<NotificationResponse> notifications, long unreadCount) {
        return NotificationListResponse.builder()
                .notifications(notifications)
                .unreadCount(unreadCount)
                .build();
    }
}