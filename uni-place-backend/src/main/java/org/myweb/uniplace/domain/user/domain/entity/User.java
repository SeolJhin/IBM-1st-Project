// Entity
package org.myweb.uniplace.domain.user.domain.entity;

import java.time.LocalDate;
import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_users_email", columnNames = {"user_email"}),
        @UniqueConstraint(name = "uq_users_tel", columnNames = {"user_tel"})
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(name = "user_id", length = 50, nullable = false)
    private String userId;

    @Column(name = "user_name", length = 50, nullable = false)
    private String userName;

    @Column(name = "user_email", length = 100, nullable = false)
    private String userEmail;

    @Column(name = "user_pwd", length = 255, nullable = false)
    private String userPwd;

    @Column(name = "user_birth", nullable = false)
    private LocalDate userBirth;

    @Column(name = "user_tel", length = 20, nullable = false)
    private String userTel;

    @Column(name = "user_role", length = 20, nullable = false)
    private String userRole;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at")
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_login_at")
    private Date lastLoginAt;

    @Column(name = "user_status", length = 20, nullable = false)
    private String userStatus;

    @Column(name = "delete_yn", length = 1)
    private String deleteYn;

    /**
     * insert 직전 자동 세팅
     */
    @PrePersist
    public void prePersist() {
        Date now = new Date(System.currentTimeMillis());

        if (createdAt == null) createdAt = now;
        if (lastLoginAt == null) lastLoginAt = now;

        if (userRole == null || userRole.isBlank()) userRole = "user";
        if (userStatus == null || userStatus.isBlank()) userStatus = "active";
        if (deleteYn == null || deleteYn.isBlank()) deleteYn = "N";
    }
}