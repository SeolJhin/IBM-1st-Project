package org.myweb.uniplace.global.util;

import java.util.UUID;

public final class IdGenerator {

    private IdGenerator() {}

    /** 36자 UUID (표준) */
    public static String uuid() {
        return UUID.randomUUID().toString();
    }

    /** 하이픈 제거 32자 UUID */
    public static String uuid32() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /** 짧은 식별자(12~16자 정도) - deviceId 등에 사용 */
    public static String shortUuid() {
        // 12자: 충돌확률 낮고 충분히 실무에서 deviceId/traceId 용으로 많이 씀
        return uuid32().substring(0, 12);
    }

    /**
     * 기존 코드 호환용: prefix 붙여서 생성
     * 예) generate("USR") -> "USR_3f0a1c2d9eab"
     */
    public static String generate(String prefix) {
        String p = (prefix == null || prefix.isBlank()) ? "ID" : prefix.trim();
        return p + "_" + shortUuid();
    }
}
