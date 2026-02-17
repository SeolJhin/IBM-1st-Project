package org.myweb.uniplace.global.util;

import java.util.UUID;

public class IdGenerator {

    private IdGenerator() {}

    /**
     * 예) IdGenerator.generate("USR") -> "USR_550e8400e29b41d4a716446655440000"
     */
    public static String generate(String prefix) {
        String uuid = UUID.randomUUID().toString().replace("-", "");
        if (prefix == null || prefix.isBlank()) {
            return uuid;
        }
        return prefix + "_" + uuid;
    }
}
