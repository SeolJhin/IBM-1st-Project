package org.myweb.uniplace.global.security;

import lombok.Getter;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;

@Getter
public class AuthUser {
    private final String userId;
    private final UserRole role;

    public AuthUser(String userId, UserRole role) {
        this.userId = userId;
        this.role = role;
    }
}
