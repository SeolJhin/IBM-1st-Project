package org.myweb.uniplace.global.security.oauth;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.domain.entity.SocialAccount;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.SocialAccountRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final SocialAccountRepository socialAccountRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        ParsedOAuth parsed = parse(provider, attributes);

        SocialAccount linked = socialAccountRepository
            .findByProviderAndProviderUserId(parsed.provider().toUpperCase(), parsed.providerId())
            .orElse(null);
        if (linked != null) {
            User existing = requireLoginable(linked.getUser());
            return UserContext.registered(
                existing,
                attributes,
                parsed.provider().toUpperCase(),
                parsed.providerId(),
                parsed.email(),
                parsed.nickname()
            );
        }

        return UserContext.signupPending(
            parsed.provider().toUpperCase(),
            parsed.providerId(),
            parsed.email(),
            parsed.nickname(),
            attributes
        );
    }

    @SuppressWarnings("unchecked")
    private ParsedOAuth parse(String provider, Map<String, Object> attributes) {
        if ("google".equals(provider)) {
            String providerId = asText(attributes.get("sub"));
            String email = asText(attributes.get("email"));
            String nickname = asText(attributes.get("name"));
            return new ParsedOAuth(provider, providerId, email, nickname);
        }

        if ("kakao".equals(provider)) {
            String providerId = asText(attributes.get("id"));
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = kakaoAccount == null ? null : (Map<String, Object>) kakaoAccount.get("profile");

            String email = kakaoAccount == null ? null : asText(kakaoAccount.get("email"));
            String nickname = profile == null ? null : asText(profile.get("nickname"));

            return new ParsedOAuth(provider, providerId, email, nickname);
        }

        throw new OAuthTypeMatchNotFoundException(provider);
    }

    private static String asText(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static User requireLoginable(User user) {
        if (user == null || !user.canLogin()) {
            throw new OAuth2AuthenticationException(
                new OAuth2Error("access_denied"),
                "blocked_user"
            );
        }
        return user;
    }

    private record ParsedOAuth(
        String provider,
        String providerId,
        String email,
        String nickname
    ) {
    }
}
