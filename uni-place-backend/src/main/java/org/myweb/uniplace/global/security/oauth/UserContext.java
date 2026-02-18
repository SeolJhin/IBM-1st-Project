package org.myweb.uniplace.global.security.oauth;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

import org.myweb.uniplace.domain.user.domain.entity.User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import lombok.Getter;

@Getter
public class UserContext implements OAuth2User {

    private final User user;
    private final Map<String, Object> attributes;

    public UserContext(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    public String getUserId() {
        return user.getUserId();
    }

    public String getEmail() {
        return user.getUserEmail();
    }

    public String getRole() {
        return user.getUserRole().name();
    }

    public String getNickname() {
        return user.getUserNm();
    }

    @Override
    public Collection<SimpleGrantedAuthority> getAuthorities() {
        return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getUserRole().name())
        );
    }

    @Override
    public String getName() {
        return String.valueOf(user.getUserId());
    }
}
