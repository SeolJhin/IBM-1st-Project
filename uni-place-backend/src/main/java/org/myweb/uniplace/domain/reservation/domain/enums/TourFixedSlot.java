// 경로: org/myweb/uniplace/domain/reservation/domain/enums/TourFixedSlot.java
package org.myweb.uniplace.domain.reservation.domain.enums;

import java.time.LocalTime;
import java.util.Arrays;

public enum TourFixedSlot {

    SLOT_09_10(LocalTime.of(9, 0), LocalTime.of(10, 0)),
    SLOT_10_11(LocalTime.of(10, 0), LocalTime.of(11, 0)),
    SLOT_11_12(LocalTime.of(11, 0), LocalTime.of(12, 0)),
    SLOT_12_13(LocalTime.of(12, 0), LocalTime.of(13, 0)),
    SLOT_13_14(LocalTime.of(13, 0), LocalTime.of(14, 0)),
    SLOT_14_15(LocalTime.of(14, 0), LocalTime.of(15, 0)),
    SLOT_15_16(LocalTime.of(15, 0), LocalTime.of(16, 0)),
    SLOT_16_17(LocalTime.of(16, 0), LocalTime.of(17, 0)),
    SLOT_17_18(LocalTime.of(17, 0), LocalTime.of(18, 0));

    private final LocalTime start;
    private final LocalTime end;

    TourFixedSlot(LocalTime start, LocalTime end) {
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
    public static TourFixedSlot[] all() {
        return values();
    }

    public String label() {
        return start + "~" + end;
    }
}