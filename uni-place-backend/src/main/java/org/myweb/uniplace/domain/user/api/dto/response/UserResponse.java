package org.myweb.uniplace.domain.user.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {
    private String userId;
    private String userNm;
    private String userEmail;
    private LocalDate userBirth;
    private String userTel;

    private String userRole;
    private UserStatus userSt;
    private String deleteYN;

    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static UserResponse from(User u) {
        String roleName = u.getUserRole() == null ? null : u.getUserRole().name();

        return UserResponse.builder()
                .userId(u.getUserId())
                .userNm(u.getUserNm())
                .userEmail(u.getUserEmail())
                .userBirth(u.getUserBirth())
                .userTel(u.getUserTel())
                .userRole(roleName)
                .userSt(u.getUserSt())
                .deleteYN(u.getDeleteYN())
                .createdAt(u.getCreatedAt())
                .lastLoginAt(u.getLastLoginAt())
                .build();
    }
}
