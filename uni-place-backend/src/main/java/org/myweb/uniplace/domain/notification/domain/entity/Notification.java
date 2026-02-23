// 경로: org/myweb/uniplace/domain/notification/domain/entity/Notification.java
package org.myweb.uniplace.domain.notification.domain.entity;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "notification",
        indexes = {
                @Index(name = "ix_notification_receiver", columnList = "receiver_id"),
                @Index(name = "ix_notification_sender", columnList = "sender_id"),
                @Index(name = "ix_notification_created", columnList = "created_at")
        }
)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Integer notificationId;

    @Column(name = "receiver_id", length = 50, nullable = false)
    private String receiverId;

    // ✅ SQL: code VARCHAR(20) -> enum STRING 저장
    @Enumerated(EnumType.STRING)
    @Column(name = "code", length = 20, nullable = false)
    private NotificationType code;

    @Column(name = "sender_id", length = 50)
    private String senderId;

    @Column(name = "message", length = 255)
    private String message;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_read", length = 1, nullable = false, columnDefinition = "CHAR(1)")
    private String isRead; // 'N'/'Y'

    @Column(name = "is_read_at")
    private LocalDateTime isReadAt;

    @Column(name = "target_id")
    private Integer targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target")
    private TargetType target;

    @Column(name = "url_path", length = 260)
    private String urlPath;

    @PrePersist
    void prePersist() {
        if (isRead == null) isRead = "N";
    }

    public void markRead() {
        if (!"Y".equalsIgnoreCase(this.isRead)) {
            this.isRead = "Y";
            this.isReadAt = LocalDateTime.now();
        }
    }
}
