package org.myweb.uniplace.domain.ai.application.usecase;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingSummaryResponse;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.myweb.uniplace.domain.property.application.RoomService;
import org.myweb.uniplace.domain.property.domain.enums.PetAllowedYn;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.RoomType;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 방 가용성 검색 UseCase.
 *
 * ─ 건물명 매칭 전략 ─────────────────────────────────────────
 * Java에서 한글↔영문 건물명 파싱을 하지 않고,
 * available_building_names + history를 LLM에 전달해
 * LLM이 사용자 표현에 맞는 건물을 직접 판단하도록 합니다.
 *
 * Python intent_classifier가 extracted_slots.building_nm에
 * 정확한 건물명을 담아주면 그것을 우선 사용합니다.
 */
@Component
public class RoomAvailabilityUseCase extends AbstractForwardUseCase {

    private final RoomService roomService;
    private final BuildingService buildingService;

    public RoomAvailabilityUseCase(AiGateway aiGateway,
                                   RoomService roomService,
                                   BuildingService buildingService) {
        super(aiGateway);
        this.roomService = roomService;
        this.buildingService = buildingService;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) slots.putAll(request.getSlots());

        // ── DB 전체 건물명 목록 조회 → LLM 건물명 매칭용 ────────────
        List<String> allBuildingNames = buildingService
            .searchPageWithFilters(null, null, null, PageRequest.of(0, 200))
            .getContent()
            .stream()
            .map(BuildingSummaryResponse::getBuildingNm)
            .filter(nm -> nm != null && !nm.isBlank())
            .toList();

        slots.put("available_building_names", allBuildingNames);

        // ── 방 목록 조회 ──────────────────────────────────────────────
        slots.put("items", fetchRoomItems(slots));

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent())
            .userId(request.getUserId())
            .userSegment(request.getUserSegment())
            .prompt(request.getPrompt())
            .slots(slots)
            .build());
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.ROOM_AVAILABILITY_SEARCH;
    }

    private List<Map<String, Object>> fetchRoomItems(Map<String, Object> slots) {
        org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest roomSearchRequest =
            org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest.builder()
                .buildingNm(stringSlot(slots, "building_nm", "buildingNm"))
                .buildingAddr(stringSlot(slots, "building_addr", "buildingAddr"))
                .maxRentPrice(toBigDecimal(intSlot(slots, "max_rent_price", "rentPrice", "rent_price")))
                .minRentPrice(toBigDecimal(intSlot(slots, "min_rent_price")))
                .minRoomCapacity(intSlot(slots, "room_capacity", "roomCapacity"))
                .petAllowedYn(parsePetAllowed(stringSlot(slots, "pet_allowed_yn", "petAllowedYn")))
                .roomType(parseRoomType(stringSlot(slots, "room_type", "roomType")))
                .roomOptions(stringSlot(slots, "option"))
                .roomSt(RoomStatus.available)
                .minParkingCapacity(parkingRequired(slots) ? 1 : null)
                .build();

        return roomService.searchPage(roomSearchRequest, PageRequest.of(0, 30))
            .getContent()
            .stream()
            .map(this::toItem)
            .toList();
    }

    private Map<String, Object> toItem(RoomSummaryResponse room) {
        Map<String, Object> item = new HashMap<>();
        item.put("room_id",        room.getRoomId());
        item.put("room_no",        room.getRoomNo());
        item.put("building_nm",    room.getBuildingNm() != null ? room.getBuildingNm() : "알 수 없음");
        item.put("building_addr",  room.getBuildingAddr());
        item.put("rent_price",     toInteger(room.getRentPrice()));
        item.put("deposit",        toInteger(room.getDeposit()));
        item.put("manage_fee",     toInteger(room.getManageFee()));
        item.put("room_capacity",  room.getRoomCapacity());
        item.put("room_type",      room.getRoomType() != null ? room.getRoomType().name() : null);
        item.put("parking",        room.getParkingCapacity() != null && room.getParkingCapacity() > 0);
        item.put("pet_allowed_yn", room.getPetAllowedYn() != null ? room.getPetAllowedYn().name() : "N");
        item.put("floor",          room.getFloor());
        item.put("room_size",      room.getRoomSize());
        item.put("room_st",        "available");
        return item;
    }

    private boolean parkingRequired(Map<String, Object> slots) {
        String option = stringSlot(slots, "option");
        if (option != null) {
            String lo = option.toLowerCase();
            if (lo.contains("parking") || lo.contains("park") || lo.contains("주차")) return true;
        }
        Object minPark = slotValue(slots, "min_parking_capacity", "minParkingCapacity");
        if (minPark instanceof Number n) return n.intValue() >= 1;
        return false;
    }

    private PetAllowedYn parsePetAllowed(String value) {
        if (value == null || value.isBlank()) return null;
        return switch (value.trim().toUpperCase()) {
            case "Y", "YES", "TRUE" -> PetAllowedYn.Y;
            case "N", "NO", "FALSE" -> PetAllowedYn.N;
            default -> null;
        };
    }

    private RoomType parseRoomType(String value) {
        if (value == null || value.isBlank()) return null;
        String v = value.trim().toLowerCase();
        if (v.contains("single") || v.contains("one") || v.contains("원룸") || v.contains("one_room")) return RoomType.one_room;
        if (v.contains("double") || v.contains("two") || v.contains("투룸") || v.contains("two_room")) return RoomType.two_room;
        if (v.contains("triple") || v.contains("three") || v.contains("쓰리룸") || v.contains("three_room")) return RoomType.three_room;
        if (v.contains("loft") || v.contains("복층")) return RoomType.loft;
        if (v.contains("share") || v.contains("쉐어")) return RoomType.share;
        return null;
    }

    // ── 슬롯 헬퍼 ────────────────────────────────────────────────────

    private Integer intSlot(Map<String, Object> slots, String... keys) {
        Object value = slotValue(slots, keys);
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (NumberFormatException e) { return null; }
    }

    private String stringSlot(Map<String, Object> slots, String... keys) {
        Object value = slotValue(slots, keys);
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Object slotValue(Map<String, Object> slots, String... keys) {
        for (String key : keys) {
            if (slots.containsKey(key)) return slots.get(key);
        }
        return null;
    }

    private BigDecimal toBigDecimal(Integer value) {
        return value != null ? BigDecimal.valueOf(value) : null;
    }

    private Integer toInteger(BigDecimal value) {
        return value != null ? value.intValue() : null;
    }
}