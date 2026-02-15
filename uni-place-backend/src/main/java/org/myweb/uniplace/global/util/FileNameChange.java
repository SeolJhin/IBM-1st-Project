// 공통 유틸 (FileNameChange)
// 경로: org/myweb/uniplace/global/util/FileNameChange.java
package org.myweb.uniplace.global.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * FileNameChange
 * - 업로드 파일명 변경 공통 유틸
 * - 원본 확장자 유지
 * - 날짜 / UUID / 날짜+UUID 전략 제공
 */
public final class FileNameChange {

    private FileNameChange() {
    }

    public enum RenameStrategy {
        DATETIME,          // yyyyMMddHHmmss
        UUID,              // uuid
        DATETIME_UUID      // yyyyMMddHHmmss_uuid
    }

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /**
     * 기본 전략: DATETIME_UUID
     */
    public static String change(String originalFilename) {
        return change(originalFilename, RenameStrategy.DATETIME_UUID);
    }

    public static String change(String originalFilename, RenameStrategy strategy) {

        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("원본 파일명이 없습니다.");
        }

        String extension = extractExtension(originalFilename);

        String renamed;
        switch (strategy) {
            case UUID -> renamed = UUID.randomUUID().toString();
            case DATETIME -> renamed = now();
            case DATETIME_UUID -> renamed = now() + "_" + UUID.randomUUID();
            default -> throw new IllegalStateException("지원하지 않는 파일명 전략입니다.");
        }

        return renamed + extension;
    }

    private static String now() {
        return LocalDateTime.now().format(FORMATTER);
    }

    private static String extractExtension(String filename) {
        int idx = filename.lastIndexOf(".");
        return (idx > -1) ? filename.substring(idx) : "";
    }
}