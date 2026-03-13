package org.myweb.uniplace.domain.ai.application.usecase;

import java.time.Duration;
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
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceResponse;
import org.myweb.uniplace.domain.property.application.SpaceService;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;
import org.myweb.uniplace.domain.reservation.repository.SpaceReservationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 공용시설 예약 추천 UseCase
 *
 * [핵심 로직]
 * 1. 로그인 사용자의 현재 active 계약에서 건물 ID를 자동 추출
 * 2. 해당 건물의 공용공간만 필터링 (다른 건물 공간 추천 불가)
 * 3. 각 공용공간의 비는 시간대를 탐색하여 추천
 * 4. 과거 예약 패턴(Collaborative Filtering)을 slots에 포함하여 AI에 전달
 */
@Component
public class CommonSpaceRecommendUseCase extends AbstractForwardUseCase {

    private static final List<SpaceReservationStatus> INACTIVE_STATUSES =
        List.of(SpaceReservationStatus.cancelled, SpaceReservationStatus.ended);

    private final SpaceService spaceService;
    private final SpaceReservationRepository spaceReservationRepository;
    private final ContractRepository contractRepository;

    public CommonSpaceRecommendUseCase(
        AiGateway aiGateway,
        SpaceService spaceService,
        SpaceReservationRepository spaceReservationRepository,
        ContractRepository contractRepository
    ) {
        super(aiGateway);
        this.spaceService = spaceService;
        this.spaceReservationRepository = spaceReservationRepository;
        this.contractRepository = contractRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        String userId = request.getUserId();

        // ── 1. 사용자의 active 계약에서 건물 ID 자동 추출 ──────────────
        Integer resolvedBuildingId = intSlot(slots, "buildingId", "building_id");

        if (userId != null && !userId.isBlank()) {
            List<Contract> activeContracts = contractRepository
                .findActiveContractsWithRoomAndBuilding(
                    userId,
                    ContractStatus.active,
                    LocalDate.now()
                );

            if (!activeContracts.isEmpty()) {
                Contract activeContract = activeContracts.get(0);
                if (activeContract.getRoom() != null
                    && activeContract.getRoom().getBuilding() != null) {

                    Integer contractBuildingId = activeContract.getRoom().getBuilding().getBuildingId();
                    String contractBuildingNm  = activeContract.getRoom().getBuilding().getBuildingNm();

                    // buildingId가 slots에 없으면 계약 건물 ID로 자동 설정
                    if (resolvedBuildingId == null) {
                        resolvedBuildingId = contractBuildingId;
                    }

                    // 요청한 buildingId가 계약 건물과 다른 경우 → 계약 건물로 강제 교정
                    if (!contractBuildingId.equals(resolvedBuildingId)) {
                        resolvedBuildingId = contractBuildingId;
                        slots.put("building_mismatch_corrected", true);
                    }

                    slots.put("contract_building_id", contractBuildingId);
                    slots.put("contract_building_nm", contractBuildingNm);
                    slots.put("contract_end", activeContract.getContractEnd() != null
                        ? activeContract.getContractEnd().toString() : null);
                }
            } else {
                slots.put("no_active_contract", true);
            }

            // ── 2. 사용자 예약 이력 (Collaborative Filtering) ───────────
            slots.put("user_reservation_history", fetchUserReservationHistory(userId));
        } else {
            slots.put("auth_required", true);
        }

        // ── 3. 공용공간 목록 조회 + 비는 시간대 탐색 ─────────────────────
        slots.put("building_id", resolvedBuildingId);
        slots.put("items", fetchSpaceItems(slots, resolvedBuildingId));

        AiGatewayRequest enrichedRequest = AiGatewayRequest.builder()
            .intent(request.getIntent())
            .userId(request.getUserId())
            .userSegment(request.getUserSegment())
            .prompt(request.getPrompt())
            .slots(slots)
            .build();

        return super.execute(enrichedRequest);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.COMMON_SPACE_RECOMMEND;
    }

    /**
     * 건물 내 공용공간 목록 + 비는 시간대 탐색
     */
    private List<Map<String, Object>> fetchSpaceItems(Map<String, Object> slots, Integer buildingId) {
        Integer preferredSpaceId = intSlot(slots, "spaceId", "space_id");
        LocalDateTime requestedStart = parseDateTime(stringSlot(slots, "srStartAt", "sr_start_at"));
        LocalDateTime requestedEnd   = parseDateTime(stringSlot(slots, "srEndAt",   "sr_end_at"));
        Duration duration = reservationDuration(requestedStart, requestedEnd);

        org.myweb.uniplace.domain.property.api.dto.request.SpaceSearchRequest spaceSearchRequest =
            org.myweb.uniplace.domain.property.api.dto.request.SpaceSearchRequest.builder()
                .buildingId(buildingId)
                .build();

        List<SpaceResponse> spaces = spaceService
            .searchPage(spaceSearchRequest, PageRequest.of(0, 20))
            .getContent();

        LocalDateTime baseStart = requestedStart != null
            ? requestedStart
            : LocalDate.now().plusDays(1).atTime(9, 0);

        int[] rank = {100};
        return spaces.stream()
            .filter(s -> preferredSpaceId == null || preferredSpaceId.equals(s.getSpaceId()))
            .map(s -> toItem(s, baseStart, duration, rank))
            .filter(item -> item != null)
            .toList();
    }

    /**
     * 공용공간 아이템 생성 + 비는 시간대 목록 포함
     */
    private Map<String, Object> toItem(
        SpaceResponse space,
        LocalDateTime baseStart,
        Duration duration,
        int[] rank
    ) {
        // 최대 5개의 가능 시간 슬롯 탐색
        List<Map<String, Object>> availableSlots = findAvailableSlots(
            space.getSpaceId(), baseStart, duration, 5
        );
        if (availableSlots.isEmpty()) return null;

        Map<String, Object> item = new HashMap<>();
        item.put("space_id",   space.getSpaceId());
        item.put("space_name", space.getSpaceNm());
        item.put("building_id", space.getBuildingId());
        item.put("capacity",   space.getSpaceCapacity());
        item.put("floor",      space.getSpaceFloor());
        item.put("options",    space.getSpaceOptions());

        // 첫 번째 가능 슬롯을 대표 시간으로
        item.put("start_at", availableSlots.get(0).get("start_at"));
        item.put("end_at",   availableSlots.get(0).get("end_at"));

        // 비는 시간대 전체 목록 (AI가 자연어로 안내할 수 있도록)
        item.put("available_slots", availableSlots);
        item.put("score", Math.max(rank[0], 1));
        rank[0] -= 5;
        return item;
    }

    /**
     * 비는 시간대 탐색: 기준 시간부터 1시간씩 이동하며 예약 충돌 없는 슬롯 탐색
     */
    private List<Map<String, Object>> findAvailableSlots(
        Integer spaceId,
        LocalDateTime baseStart,
        Duration duration,
        int maxSlots
    ) {
        if (spaceId == null) return List.of();

        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime candidate = baseStart;
        int maxSearch = 24;

        for (int i = 0; i < maxSearch && result.size() < maxSlots; i++) {
            LocalDateTime end = candidate.plus(duration);
            boolean conflict = spaceReservationRepository.existsSpaceTimeConflict(
                spaceId, INACTIVE_STATUSES, candidate, end
            );
            if (!conflict) {
                Map<String, Object> slot = new HashMap<>();
                slot.put("start_at", candidate.toString());
                slot.put("end_at",   end.toString());
                result.add(slot);
            }
            candidate = candidate.plusHours(1);
        }
        return result;
    }

    /**
     * 사용자 예약 이력 조회 (Collaborative Filtering 입력 데이터)
     */
    private List<Map<String, Object>> fetchUserReservationHistory(String userId) {
        return spaceReservationRepository
            .findByUser_UserId(userId,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "reservationId")))
            .getContent()
            .stream()
            .map(r -> {
                Map<String, Object> item = new HashMap<>();
                item.put("reservation_id", r.getReservationId());
                item.put("status",   r.getSrSt()      != null ? r.getSrSt().name()           : null);
                item.put("start_at", r.getSrStartAt() != null ? r.getSrStartAt().toString()   : null);
                item.put("end_at",   r.getSrEndAt()   != null ? r.getSrEndAt().toString()     : null);
                if (r.getSpace()    != null) item.put("space_nm",    r.getSpace().getSpaceNm());
                if (r.getBuilding() != null) item.put("building_nm", r.getBuilding().getBuildingNm());
                return item;
            })
            .toList();
    }

    private Duration reservationDuration(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && end.isAfter(start)) {
            Duration d = Duration.between(start, end);
            if (!d.isNegative() && !d.isZero()) return d;
        }
        return Duration.ofHours(1);
    }

    private Integer intSlot(Map<String, Object> slots, String... keys) {
        Object v = slotValue(slots, keys);
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(v)); } catch (NumberFormatException e) { return null; }
    }

    private String stringSlot(Map<String, Object> slots, String... keys) {
        Object v = slotValue(slots, keys);
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }

    private Object slotValue(Map<String, Object> slots, String... keys) {
        for (String k : keys) {
            if (slots.containsKey(k)) return slots.get(k);
        }
        return null;
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try { return LocalDateTime.parse(value.replace("Z", "")); } catch (Exception e) { return null; }
    }
}