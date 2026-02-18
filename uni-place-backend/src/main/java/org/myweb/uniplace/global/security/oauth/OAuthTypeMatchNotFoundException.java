package org.myweb.uniplace.global.security.oauth;

public class OAuthTypeMatchNotFoundException extends RuntimeException {

    public OAuthTypeMatchNotFoundException(String provider) {
        super("Unsupported OAuth provider: " + provider);
    }
}
