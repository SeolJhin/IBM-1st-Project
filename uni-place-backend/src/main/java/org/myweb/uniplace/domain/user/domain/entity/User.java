package org.myweb.uniplace.domain.user.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;
import org.myweb.uniplace.global.common.BaseTimeEntity;

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
public class User extends BaseTimeEntity {

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
    @Column(name = "user_role", length = 20, nullable = false)
    private UserRole userRole;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_st", length = 20, nullable = false)
    private UserStatus userSt;

    @Column(name = "delete_yn", length = 1, nullable = false)
    private String deleteYN;

    /**
     * DB: CHAR(1) NOT NULL DEFAULT 'Y'
     * Y(추가정보 필요), N(추가정보 완료)
     */
    @Column(name = "first_sign", length = 1, nullable = false, columnDefinition = "CHAR(1)")
    private String firstSign;

    @PrePersist
    void onCreate() {
        if (userRole == null) userRole = UserRole.user;
        if (userSt == null) userSt = UserStatus.active;
        if (deleteYN == null) deleteYN = "N";
        if (firstSign == null) firstSign = "Y";
        // DB 기본값과 동일하게 엔티티 생성 시점에도 Y를 보장
    }

    public boolean canLogin() {
        return userSt == UserStatus.active && !"Y".equalsIgnoreCase(deleteYN);
    }

    public void markLoginNow() {
        this.lastLoginAt = LocalDateTime.now();
    }

    /** 추가정보 입력이 필요한 상태인지 */
    public boolean isAdditionalInfoRequired() {
        return "Y".equalsIgnoreCase(firstSign);
    }

    // 일반회원 수정
    public void changeTel(String newTel) { this.userTel = newTel; }
    public void changeEmail(String newEmail) { this.userEmail = newEmail; }
    public void changePwd(String newPwd) { this.userPwd = newPwd; }

    // 관리자용
    public void changeRole(UserRole role) { this.userRole = role; }
    public void changeStatus(UserStatus st) { this.userSt = st; }
    public void changeDeleteYN(String yn) { this.deleteYN = yn; }

    public void markFirstLoginFlagIfNeeded() {
        if (this.firstSign == null) this.firstSign = "Y";
    }

    public void markAdditionalInfoCompleted() {
        this.firstSign = "N";
    }
}
