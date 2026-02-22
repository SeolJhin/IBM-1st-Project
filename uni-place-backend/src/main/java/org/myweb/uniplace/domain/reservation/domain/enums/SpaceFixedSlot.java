// 경로: org/myweb/uniplace/domain/reservation/domain/enums/SpaceFixedSlot.java
package org.myweb.uniplace.domain.reservation.domain.enums;

import java.time.LocalTime;
import java.util.Arrays;

public enum SpaceFixedSlot {

    SLOT_08_10(LocalTime.of(8, 0), LocalTime.of(10, 0)),
    SLOT_10_12(LocalTime.of(10, 0), LocalTime.of(12, 0)),
    SLOT_12_14(LocalTime.of(12, 0), LocalTime.of(14, 0)),
    SLOT_14_16(LocalTime.of(14, 0), LocalTime.of(16, 0)),
    SLOT_16_18(LocalTime.of(16, 0), LocalTime.of(18, 0)),
    SLOT_18_20(LocalTime.of(18, 0), LocalTime.of(20, 0));

    private final LocalTime start;
    private final LocalTime end;

    SpaceFixedSlot(LocalTime start, LocalTime end) {
        this.start = start;
        this.end = end;
    }

    public LocalTime getStart() {
        return start;
    }

    public LocalTime getEnd() {
        return end;
    }

    // ✅ Validator에서 사용
    public static boolean matches(LocalTime start, LocalTime end) {
        return Arrays.stream(values())
                .anyMatch(slot ->
                        slot.start.equals(start) &&
                        slot.end.equals(end)
                );
    }

    // ✅ 슬롯 조회 API에서 사용
    public static SpaceFixedSlot[] all() {
        return values();
    }

    public String label() {
        return start + "~" + end;
    }
}