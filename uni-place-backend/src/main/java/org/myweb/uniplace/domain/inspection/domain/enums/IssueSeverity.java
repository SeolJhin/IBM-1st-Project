package org.myweb.uniplace.domain.inspection.domain.enums;

public enum IssueSeverity {
    low,      // 낮음 - 정기 점검 시 확인
    medium,   // 중간 - 1개월 내 조치 권장
    high,     // 높음 - 1주일 내 조치 필요
    critical  // 위험 - 즉각 조치 필요
}
