package org.myweb.uniplace.domain.user.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "user_id", length = 50, nullable = false)
    private String userId;

    @Column(name = "user_name", length = 50, nullable = false)
    private String userName;

    @Column(name = "user_email", length = 100, nullable = false, unique = true)
    private String userEmail;

    @Column(name = "user_pwd", length = 255, nullable = false)
    private String userPwd;

    @Column(name = "user_birth", nullable = false)
    private LocalDate userBirth;

    @Column(name = "user_tel", length = 20, nullable = false, unique = true)
    private String userTel;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", length = 20, nullable = false)
    private UserRole userRole;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_status", length = 20, nullable = false)
    private UserStatus userStatus;

    @Column(name = "delete_yn", length = 1)
    private String deleteYn;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (userStatus == null) userStatus = UserStatus.ACTIVE;
        if (deleteYn == null) deleteYn = "N";
        if (userRole == null) userRole = UserRole.GUEST; // MVP 기본값
    }

    public void markLoginNow() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return userStatus == UserStatus.ACTIVE && "N".equalsIgnoreCase(deleteYn);
    }
}
