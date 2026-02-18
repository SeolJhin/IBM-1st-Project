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
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_users_email", columnNames = "user_email")
        },
        indexes = {
                @Index(name = "ix_users_tel", columnList = "user_tel")
        }
)
public class User {

    @Id
    @Column(name = "user_id", length = 50, nullable = false)
    private String userId;

    // ✅ SQL: user_nm
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
    @Column(name = "user_role", length = 20, nullable = false)
    private UserRole userRole;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // ✅ SQL: user_st
    @Enumerated(EnumType.STRING)
    @Column(name = "user_st", length = 20, nullable = false)
    private UserStatus userSt;

    @Column(name = "delete_yn", length = 1, nullable = false)
    private String deleteYN;

    @PrePersist
    void onCreate() {
        if (userRole == null) userRole = UserRole.user;       // SQL default
        if (userSt == null) userSt = UserStatus.active;       // SQL default
        if (deleteYN == null) deleteYN = "N";                 // SQL default
    }

    public boolean canLogin() {
        return userSt == UserStatus.active && !"Y".equalsIgnoreCase(deleteYN);
    }

    public void markLoginNow() {
        this.lastLoginAt = LocalDateTime.now();
    }

    // 일반회원 수정 (정책 붙이기 전에는 tel 정도만 권장)
    public void changeTel(String newTel) { this.userTel = newTel; }
    public void changeName(String newName) { this.userNm = newName; }
    public void changePwd(String newPwd) {this.userPwd = newPwd; }

    // 관리자용
    public void changeRole(UserRole role) { this.userRole = role; }
    public void changeStatus(UserStatus st) { this.userSt = st; }
    public void changeDeleteYN(String yn) { this.deleteYN = yn; }
}
