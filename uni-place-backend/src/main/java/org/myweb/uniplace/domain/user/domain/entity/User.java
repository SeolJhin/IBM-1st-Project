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
@Table(
    name = "users",
    uniqueConstraints = @UniqueConstraint(name = "uq_users_email", columnNames = "user_email"),
    indexes = @Index(name = "ix_users_tel", columnList = "user_tel")
)
public class User {

    @Id
    @Column(name = "user_id", length = 50, nullable = false)
    private String userId;

    @Column(name = "user_nm", length = 50, nullable = false)
    private String userNm;

    @Column(name = "user_email", length = 100, nullable = false)
    private String userEmail;

    @Column(name = "user_pwd", length = 255, nullable = false)
    private String userPwd;

    @Column(name = "user_birth", nullable = false)
    private LocalDate userBirth;

    @Column(name = "user_tel", length = 20, nullable = false)
    private String userTel;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", nullable = false)
    private UserRole userRole;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_st", nullable = false)
    private UserStatus userSt;

    @Column(name = "delete_yn", length = 1, nullable = false)
    private String deleteYn;

    @PrePersist
    void onCreate() {
        if (userRole == null) userRole = UserRole.user;
        if (userSt == null) userSt = UserStatus.active;
        if (deleteYn == null) deleteYn = "N";
    }

    public void markLoginNow() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public boolean canLogin() {
        return userSt == UserStatus.active && "N".equalsIgnoreCase(deleteYn);
    }

    // 일반유저: tel만(권장)
    public void changeTel(String tel) {
        this.userTel = tel;
    }

    // 관리자: 권한/상태 변경
    public void changeRole(UserRole role) {
        this.userRole = role;
    }

    public void changeStatus(UserStatus st) {
        this.userSt = st;
    }

    public void changeDeleteYn(String yn) {
        this.deleteYn = yn;
    }
}
