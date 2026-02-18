package org.myweb.uniplace.global.security.oauth;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request)
            throws OAuth2AuthenticationException {

        OAuth2User oAuth2User = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId();

        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email;
        String nickname;

        if ("google".equals(provider)) {

            email = (String) attributes.get("email");
            nickname = (String) attributes.get("name");

        } else if ("kakao".equals(provider)) {

            Map<String, Object> kakaoAccount =
                    (Map<String, Object>) attributes.get("kakao_account");

            Map<String, Object> profile =
                    (Map<String, Object>) kakaoAccount.get("profile");

            email = (String) kakaoAccount.get("email");
            nickname = (String) profile.get("nickname");

        } else {
            throw new OAuthTypeMatchNotFoundException(provider);
        }

        User user = saveOrGet(email, nickname);

        return new UserContext(user, attributes);
    }

    private User saveOrGet(String email, String name) {

        Optional<User> optionalUser = userRepository.findByUserEmail(email);

        if (optionalUser.isPresent()) {
            return optionalUser.get();
        }

        User user = User.builder()
                .userEmail(email)
                .userNm(name)
                .userRole(UserRole.user)
                .userSt(UserStatus.active)
                .build();

        return userRepository.save(user);
    }
}
