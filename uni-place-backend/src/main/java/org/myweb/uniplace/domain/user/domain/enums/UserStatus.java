package org.myweb.uniplace.domain.user.domain.enums;

/**
 * DB users.user_st ENUM('active','inactive','banned')
 */
public enum UserStatus {
    active,
    inactive,
    banned;

    public boolean canLogin() {
        return this == active;
    }
}
