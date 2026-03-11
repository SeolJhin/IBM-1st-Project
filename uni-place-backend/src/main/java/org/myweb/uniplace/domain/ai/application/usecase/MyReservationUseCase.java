package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.reservation.domain.entity.SpaceReservationEntity;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;
import org.myweb.uniplace.domain.reservation.repository.SpaceReservationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MyReservationUseCase extends AbstractForwardUseCase {

    private final SpaceReservationRepository spaceReservationRepository;

    public MyReservationUseCase(AiGateway aiGateway,
                                SpaceReservationRepository spaceReservationRepository) {
        super(aiGateway);
        this.spaceReservationRepository = spaceReservationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) slots.putAll(request.getSlots());

        String userId = request.getUserId();
        if (userId == null || userId.isBlank()) {
            slots.put("auth_required", true);
            return super.execute(AiGatewayRequest.builder()
                .intent(request.getIntent()).userId(null)
                .userSegment(request.getUserSegment()).prompt(request.getPrompt())
                .slots(slots).build());
        }

        // ── 슬롯 추출 ─────────────────────────────────────────────────
        String sortBy    = strSlot(slots, "sort_by");
        String sortOrder = strSlot(slots, "sort_order");
        int    limit     = intSlot(slots, "limit", 20);
        String srStRaw   = strSlot(slots, "sr_st");
        String spaceNm   = strSlot(slots, "space_nm");

        // ── DB 조회 ───────────────────────────────────────────────────
        String sortCol = "asc".equalsIgnoreCase(sortOrder) ? "srStartAt" :
                         "sr_start_at".equals(sortBy)     ? "srStartAt" : "reservationId";
        Sort sort = "asc".equalsIgnoreCase(sortOrder)
            ? Sort.by(Sort.Direction.ASC,  sortCol)
            : Sort.by(Sort.Direction.DESC, sortCol);

        List<SpaceReservationEntity> reservations = spaceReservationRepository
            .findByUser_UserId(userId, PageRequest.of(0, 100, sort)).getContent();

        // ── 필터 ──────────────────────────────────────────────────────
        if (srStRaw != null) {
            try {
                SpaceReservationStatus st = SpaceReservationStatus.valueOf(srStRaw.toLowerCase());
                reservations = reservations.stream().filter(r -> st.equals(r.getSrSt())).toList();
            } catch (IllegalArgumentException ignored) {}
        }
        if (spaceNm != null && !spaceNm.isBlank()) {
            String kw = spaceNm.toLowerCase();
            reservations = reservations.stream()
                .filter(r -> r.getSpace() != null && r.getSpace().getSpaceNm() != null
                          && r.getSpace().getSpaceNm().toLowerCase().contains(kw))
                .toList();
        }
        reservations = reservations.stream().limit(limit).toList();

        // ── items 직렬화 ──────────────────────────────────────────────
        slots.put("items", reservations.stream().map(r -> {
            Map<String, Object> item = new HashMap<>();
            item.put("reservation_id", r.getReservationId());
            item.put("status",   r.getSrSt()      != null ? r.getSrSt().name() : null);
            item.put("start_at", r.getSrStartAt() != null ? r.getSrStartAt().toString() : null);
            item.put("end_at",   r.getSrEndAt()   != null ? r.getSrEndAt().toString()   : null);
            item.put("people",   r.getSrNoPeople());
            if (r.getSpace()    != null) item.put("space_nm",    r.getSpace().getSpaceNm());
            if (r.getBuilding() != null) item.put("building_nm", r.getBuilding().getBuildingNm());
            return item;
        }).toList());

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent()).userId(userId)
            .userSegment(request.getUserSegment()).prompt(request.getPrompt())
            .slots(slots).build());
    }

    @Override
    protected AiIntent getIntent() { return AiIntent.MY_RESERVATION; }

    private String strSlot(Map<String, Object> slots, String... keys) {
        for (String k : keys) {
            Object v = slots.get(k);
            if (v != null) { String s = v.toString().trim(); if (!s.isEmpty()) return s; }
        }
        return null;
    }

    private int intSlot(Map<String, Object> slots, String key, int def) {
        Object v = slots.get(key);
        if (v == null) return def;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString().trim()); } catch (NumberFormatException e) { return def; }
    }
}