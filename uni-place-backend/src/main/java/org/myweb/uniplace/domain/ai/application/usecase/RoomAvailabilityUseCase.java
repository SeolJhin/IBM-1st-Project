package org.myweb.uniplace.domain.ai.application.usecase;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.application.RoomService;
import org.myweb.uniplace.domain.property.domain.enums.PetAllowedYn;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.RoomType;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RoomAvailabilityUseCase extends AbstractForwardUseCase {

    private final RoomService roomService;

    public RoomAvailabilityUseCase(AiGateway aiGateway, RoomService roomService) {
        super(aiGateway);
        this.roomService = roomService;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        slots.put("items", fetchRoomItems(slots));

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
        return AiIntent.ROOM_AVAILABILITY_SEARCH;
    }

    private List<Map<String, Object>> fetchRoomItems(Map<String, Object> slots) {
        org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest roomSearchRequest =
            org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest.builder()
                .buildingAddr(stringSlot(slots, "buildingAddr", "building_addr"))
                .maxRentPrice(toBigDecimal(intSlot(slots, "rentPrice", "rent_price")))
                .minRoomCapacity(intSlot(slots, "roomCapacity", "room_capacity"))
                .petAllowedYn(parsePetAllowed(stringSlot(slots, "petAllowedYn", "pet_allowed_yn")))
                .roomType(parseRoomType(stringSlot(slots, "roomType", "room_type")))
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
        item.put("room_id", room.getRoomId());
        item.put("name", buildRoomName(room));
        item.put("building_addr", room.getBuildingAddr());
        item.put("rent_price", toInteger(room.getRentPrice()));
        item.put("room_capacity", room.getRoomCapacity());
        item.put("room_type", roomTypeToText(room.getRoomType()));
        item.put("parking", room.getParkingCapacity() != null && room.getParkingCapacity() > 0);
        item.put("pet_allowed_yn", room.getPetAllowedYn() != null ? room.getPetAllowedYn().name() : null);
        item.put("popularity", 0);
        return item;
    }

    private String buildRoomName(RoomSummaryResponse room) {
        String buildingName = room.getBuildingNm() == null ? "Unknown Building" : room.getBuildingNm();
        Integer roomNo = room.getRoomNo();
        if (roomNo == null) {
            return buildingName;
        }
        return buildingName + " #" + roomNo;
    }

    private boolean parkingRequired(Map<String, Object> slots) {
        String option = stringSlot(slots, "option");
        if (option == null) {
            return false;
        }
        String lowered = option.toLowerCase();
        return lowered.contains("parking") || lowered.contains("park") || option.contains("주차");
    }

    private String roomTypeToText(RoomType roomType) {
        if (roomType == null) {
            return null;
        }
        return switch (roomType) {
            case one_room -> "SINGLE";
            case two_room -> "DOUBLE";
            case three_room -> "TRIPLE";
            case loft -> "LOFT";
            case share -> "SHARE";
        };
    }

    private PetAllowedYn parsePetAllowed(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        return switch (normalized) {
            case "Y", "YES", "TRUE" -> PetAllowedYn.Y;
            case "N", "NO", "FALSE" -> PetAllowedYn.N;
            default -> null;
        };
    }

    private RoomType parseRoomType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toLowerCase();
        if (normalized.contains("single") || normalized.contains("one") || normalized.contains("1")) {
            return RoomType.one_room;
        }
        if (normalized.contains("double") || normalized.contains("two") || normalized.contains("2")) {
            return RoomType.two_room;
        }
        if (normalized.contains("triple") || normalized.contains("three") || normalized.contains("3")) {
            return RoomType.three_room;
        }
        if (normalized.contains("loft")) {
            return RoomType.loft;
        }
        if (normalized.contains("share")) {
            return RoomType.share;
        }
        return null;
    }

    private Integer intSlot(Map<String, Object> slots, String... keys) {
        Object value = slotValue(slots, keys);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String stringSlot(Map<String, Object> slots, String... keys) {
        Object value = slotValue(slots, keys);
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Object slotValue(Map<String, Object> slots, String... keys) {
        for (String key : keys) {
            if (slots.containsKey(key)) {
                return slots.get(key);
            }
        }
        return null;
    }

    private BigDecimal toBigDecimal(Integer value) {
        if (value == null) {
            return null;
        }
        return BigDecimal.valueOf(value);
    }

    private Integer toInteger(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.intValue();
    }
}
