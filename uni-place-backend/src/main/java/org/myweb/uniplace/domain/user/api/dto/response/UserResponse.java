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
    private String userName;
    private String userEmail;
    private LocalDate userBirth;
    private String userTel;
    private String userRole;    // enum name(=DB 저장값)
    private String userStatus;  // enum name(=DB 저장값)
    private String deleteYn;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static UserResponse from(User u) {
        return UserResponse.builder()
                .userId(u.getUserId())
                .userName(u.getUserName())
                .userEmail(u.getUserEmail())
                .userBirth(u.getUserBirth())
                .userTel(u.getUserTel())
                .userRole(u.getUserRole().name())
                .userStatus(u.getUserStatus().name())
                .deleteYn(u.getDeleteYn())
                .createdAt(u.getCreatedAt())
                .lastLoginAt(u.getLastLoginAt())
                .build();
    }
}
