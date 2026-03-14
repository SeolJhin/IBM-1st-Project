package org.myweb.uniplace.domain.inspection.domain.enums;

public enum InspectionStatus {
    completed,       // 점검 완료 (이상 없음)
    issue_detected,  // 문제 감지됨 (티켓 자동 생성됨)
    no_change        // 변화 없음 (변화율 1% 미만)
}
