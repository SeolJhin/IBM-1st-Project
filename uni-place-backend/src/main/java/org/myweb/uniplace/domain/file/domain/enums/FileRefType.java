// 경로: org/myweb/uniplace/domain/file/domain/enums/FileRefType.java
package org.myweb.uniplace.domain.file.domain.enums;

public enum FileRefType {

    ROOM("ROOM"),
    BOARD("BOARD"),
    CONTRACT("CONTRACT"),
    NOTICE("NOTICE"),
    REVIEW("REVIEW"),
    BANNER("BANNER"),
    QNA("QNA"),
    COMPLAIN("COMPLAIN"),
    SPACE("SPACE"),
    COMPANY("COMPANY"),
    PRODUCT("PRODUCT"),
	BUILDING("BUILDING"),
	INSPECTION("INSPECTION");

    private final String value;

    FileRefType(String value) {
        this.value = value;
    }

    public String dbValue() {
        return value;
    }

    // ✅ name() 기준으로도, value 기준으로도 찾을 수 있게 수정
    public static FileRefType from(String input) {
        if (input == null || input.isBlank()) {
            throw new IllegalArgumentException("fileParentType이 없습니다.");
        }
        String upper = input.trim().toUpperCase();
        for (FileRefType t : values()) {
            if (t.name().equals(upper) || t.value.equals(upper)) return t;
        }
        throw new IllegalArgumentException("지원하지 않는 FileRefType 입니다: " + input);
    }
}