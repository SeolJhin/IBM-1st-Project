package org.myweb.uniplace.global.security.oauth;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.user.domain.entity.SocialAccount;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.SocialAccountRepository;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final NotificationService notificationService;

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
            return UserContext.registered(requireLoginable(linked.getUser()), attributes);
        }

        String normalizedEmail = normalizeEmail(parsed.email());
        if (normalizedEmail != null && !normalizedEmail.isBlank()) {
            User existingByEmail = userRepository.findByUserEmail(normalizedEmail).orElse(null);
            if (existingByEmail != null) {
                requireLoginable(existingByEmail);
                linkSocialAccountIfPossible(existingByEmail, parsed);
                return UserContext.registered(existingByEmail, attributes);
            }
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

    private static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private void linkSocialAccountIfPossible(User user, ParsedOAuth parsed) {
        if (user == null || parsed == null) {
            return;
        }
        if (parsed.provider() == null || parsed.provider().isBlank()) {
            return;
        }
        if (parsed.providerId() == null || parsed.providerId().isBlank()) {
            return;
        }
        if (socialAccountRepository.existsByProviderAndProviderUserId(parsed.provider().toUpperCase(), parsed.providerId())) {
            return;
        }

        SocialAccount linked = SocialAccount.builder()
            .user(user)
            .provider(parsed.provider().toUpperCase())
            .providerUserId(parsed.providerId())
            .providerEmail(parsed.email())
            .build();
        socialAccountRepository.save(linked);
        notifySocialLinked(user.getUserId(), parsed.provider().toUpperCase());
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

    private void notifySocialLinked(String userId, String provider) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        try {
            notificationService.notifyUser(
                userId,
                NotificationType.SEC_SOCIAL_LINK.name(),
                "소셜 계정 연동이 완료되었습니다. (provider=" + provider + ")",
                null,
                TargetType.notice,
                null,
                "/mypage/security"
            );
        } catch (Exception e) {
            log.warn("[AUTH][NOTIFY] social link notify failed userId={} reason={}", userId, e.getMessage());
        }
    }

    private record ParsedOAuth(
        String provider,
        String providerId,
        String email,
        String nickname
    ) {
    }
}
