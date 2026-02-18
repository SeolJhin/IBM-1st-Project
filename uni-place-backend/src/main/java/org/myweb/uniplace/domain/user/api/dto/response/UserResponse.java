package org.myweb.uniplace.domain.user.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.user.domain.entity.User;

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
    private String userSt;
    private String deleteYN;

    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static UserResponse from(User u) {
        return UserResponse.builder()
                .userId(u.getUserId())
                .userNm(u.getUserNm())
                .userEmail(u.getUserEmail())
                .userBirth(u.getUserBirth())
                .userTel(u.getUserTel())
                .userRole(u.getUserRole().name())
                .deleteYN(u.getDeleteYN())
                .createdAt(u.getCreatedAt())
                .lastLoginAt(u.getLastLoginAt())
                .build();
    }
}
