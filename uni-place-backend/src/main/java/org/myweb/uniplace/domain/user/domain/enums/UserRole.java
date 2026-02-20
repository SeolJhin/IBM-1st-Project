package org.myweb.uniplace.domain.user.domain.enums;

/**
 * DB users.user_role ENUM('admin','user','tenant')
 * EnumType.STRING 저장이므로 "enum 이름"이 DB에 그대로 들어감.
 */
public enum UserRole {
    admin,
    user,
    tenant;

    public boolean isAdmin() {
        return this == admin;
    }
    
    
}
