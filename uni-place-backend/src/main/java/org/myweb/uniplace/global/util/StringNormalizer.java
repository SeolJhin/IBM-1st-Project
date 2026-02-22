package org.myweb.uniplace.global.util;

public final class StringNormalizer {

    private StringNormalizer() {}

    /**
     * null -> null
     * "" / "   " -> null
     * 그 외 -> trim() 적용한 문자열
     */
    public static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}