// 경로: org/myweb/uniplace/domain/notification/application/NotificationService.java
// ✅ 변경사항: deleteRead(String userId) 메서드 추가
package org.myweb.uniplace.domain.notification.application;

import org.myweb.uniplace.domain.notification.api.dto.response.NotificationListResponse;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    NotificationListResponse my(String userId, Pageable pageable);

    NotificationListResponse myUnread(String userId, Pageable pageable);

    void markRead(String userId, Integer notificationId);

    int markAllRead(String userId);

    int deleteRead(String userId);

    void notifyUser(String receiverId,
                    String code,
                    String message,
                    String senderId,
                    TargetType target,
                    Integer targetId,
                    String urlPath);

    void notifyAdmins(String code,
                      String message,
                      String senderId,
                      TargetType target,
                      Integer targetId,
                      String urlPath);
}
