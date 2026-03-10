package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.reservation.domain.entity.TourReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;
import org.myweb.uniplace.domain.reservation.repository.TourReservationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MyTourUseCase extends AbstractForwardUseCase {

    private final TourReservationRepository tourRepository;

    public MyTourUseCase(AiGateway aiGateway, TourReservationRepository tourRepository) {
        super(aiGateway);
        this.tourRepository = tourRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) slots.putAll(request.getSlots());

        // 투어는 tourTel+tourPwd 기반이라 userId로 직접 조회 불가
        // 로그인 유저라면 등록된 전화번호를 slots에 전달받아야 함
        String userId = request.getUserId();
        String tourTel = slots.get("tourTel") instanceof String s ? s :
                         slots.get("tour_tel") instanceof String s2 ? s2 : null;
        String tourPwd = slots.get("tourPwd") instanceof String s ? s :
                         slots.get("tour_pwd") instanceof String s2 ? s2 : null;

        if (tourTel == null || tourPwd == null) {
            slots.put("auth_required", userId == null);
            slots.put("guide", "투어 예약 조회는 예약 시 등록한 전화번호와 비밀번호가 필요합니다.");
            return super.execute(AiGatewayRequest.builder()
                .intent(request.getIntent()).userId(userId)
                .userSegment(request.getUserSegment()).prompt(request.getPrompt())
                .slots(slots).build());
        }

        List<TourReservationEntity> tours = tourRepository
            .findByTourTelAndTourPwd(tourTel, tourPwd, PageRequest.of(0, 10)).getContent();

        slots.put("items", tours.stream().map(t -> {
            Map<String, Object> item = new HashMap<>();
            item.put("tour_id", t.getTourId());
            item.put("tour_nm", t.getTourNm());
            item.put("tour_st", t.getTourSt() != null ? t.getTourSt().name() : null);
            item.put("start_at", t.getTourStartAt() != null ? t.getTourStartAt().toString() : null);
            item.put("end_at", t.getTourEndAt() != null ? t.getTourEndAt().toString() : null);
            if (t.getBuilding() != null) item.put("building_nm", t.getBuilding().getBuildingNm());
            if (t.getRoom() != null) item.put("room_no", t.getRoom().getRoomNo());
            return item;
        }).toList());

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent()).userId(userId)
            .userSegment(request.getUserSegment()).prompt(request.getPrompt())
            .slots(slots).build());
    }

    @Override
    protected AiIntent getIntent() { return AiIntent.MY_TOUR; }
}
