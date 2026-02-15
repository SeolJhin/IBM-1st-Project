// 경로: org/myweb/uniplace/domain/file/domain/enums/FileRefType.java
package org.myweb.uniplace.domain.file.domain.enums;

public enum FileRefType {

    ROOM("ROOM"),
    BOARD("BOARD"),
    NOTICE("NOTICE"),
    REVIEW("REVIEW"),
    BANNER("BANNER"),
    QNA("QNA"),
    COMPLAIN("COMPLAIN"),
    COMPANY("COMPANY");

    private final String value;

    FileRefType(String value) {
        this.value = value;
    }

    public String dbValue() {
        return value;
    }

    public static FileRefType from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("fileParentType이 없습니다.");
        }
        for (FileRefType t : values()) {
            if (t.value.equalsIgnoreCase(value.trim())) return t;
        }
        throw new IllegalArgumentException("지원하지 않는 FileRefType 입니다: " + value);
    }
}