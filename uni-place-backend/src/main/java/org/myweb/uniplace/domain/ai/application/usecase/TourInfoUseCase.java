package org.myweb.uniplace.domain.ai.application.usecase;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;
import org.myweb.uniplace.domain.reservation.repository.TourReservationRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TourInfoUseCase extends AbstractForwardUseCase {

    private static final List<TourStatus> INACTIVE = List.of(TourStatus.cancelled, TourStatus.ended);

    private final TourReservationRepository tourRepository;

    public TourInfoUseCase(AiGateway aiGateway, TourReservationRepository tourRepository) {
        super(aiGateway);
        this.tourRepository = tourRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) slots.putAll(request.getSlots());

        // roomId가 전달된 경우 실제 충돌 체크, 없으면 충돌 체크 없이 슬롯 제공
        Integer roomId = null;
        Object roomIdObj = slots.get("roomId");
        if (roomIdObj instanceof Number n) roomId = n.intValue();

        slots.put("items", fetchTourSlots(roomId));
        slots.put("tour_guide",
            "투어 예약은 원하는 방을 선택 후 날짜/시간을 선택하면 됩니다. 투어 시간은 1시간이며 현장 확인 후 계약 진행 가능합니다.");

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent())
            .userId(request.getUserId())
            .userSegment(request.getUserSegment())
            .prompt(request.getPrompt())
            .slots(slots)
            .build());
    }

    @Override
    protected AiIntent getIntent() { return AiIntent.TOUR_INFO; }

    /**
     * 향후 7일간 예약 가능 시간대 제공.
     * roomId가 있으면 DB에서 실제 충돌 여부를 확인하고,
     * roomId가 없으면 충돌 체크 없이 모든 슬롯을 available=true로 반환.
     */
    private List<Map<String, Object>> fetchTourSlots(Integer roomId) {
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int day = 1; day <= 7; day++) {
            LocalDate date = now.toLocalDate().plusDays(day);
            for (int hour : new int[]{10, 14, 16}) {
                LocalDateTime start = date.atTime(hour, 0);
                LocalDateTime end = start.plusHours(1);

                // ✅ roomId가 있을 때만 실제 DB 충돌 체크 (기존: 항상 available=true였던 버그 수정)
                boolean available = (roomId == null) || !tourRepository.existsRoomTimeConflict(
                    roomId, INACTIVE, start, end
                );

                Map<String, Object> slot = new HashMap<>();
                slot.put("date", date.toString());
                slot.put("start_time", start.toString());
                slot.put("end_time", end.toString());
                slot.put("available", available);
                result.add(slot);
            }
        }
        return result;
    }
}
