package org.myweb.uniplace.domain.ai.application.usecase;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceResponse;
import org.myweb.uniplace.domain.property.application.SpaceService;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;
import org.myweb.uniplace.domain.reservation.repository.SpaceReservationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CommonSpaceRecommendUseCase extends AbstractForwardUseCase {

    private static final List<SpaceReservationStatus> INACTIVE_STATUSES =
        List.of(SpaceReservationStatus.cancelled, SpaceReservationStatus.ended);

    private final SpaceService spaceService;
    private final SpaceReservationRepository spaceReservationRepository;

    public CommonSpaceRecommendUseCase(
        AiGateway aiGateway,
        SpaceService spaceService,
        SpaceReservationRepository spaceReservationRepository
    ) {
        super(aiGateway);
        this.spaceService = spaceService;
        this.spaceReservationRepository = spaceReservationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        slots.put("items", fetchSpaceItems(slots));

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

    private List<Map<String, Object>> fetchSpaceItems(Map<String, Object> slots) {
        Integer buildingId = intSlot(slots, "buildingId", "building_id");
        Integer preferredSpaceId = intSlot(slots, "spaceId", "space_id");
        LocalDateTime requestedStart = parseDateTime(stringSlot(slots, "srStartAt", "sr_start_at"));
        LocalDateTime requestedEnd = parseDateTime(stringSlot(slots, "srEndAt", "sr_end_at"));
        Duration duration = reservationDuration(requestedStart, requestedEnd);

        org.myweb.uniplace.domain.property.api.dto.request.SpaceSearchRequest spaceSearchRequest =
            org.myweb.uniplace.domain.property.api.dto.request.SpaceSearchRequest.builder()
                .buildingId(buildingId)
                .build();

        List<SpaceResponse> spaces = spaceService.searchPage(spaceSearchRequest, PageRequest.of(0, 20)).getContent();

        LocalDateTime baseStart = requestedStart != null
            ? requestedStart
            : LocalDate.now().plusDays(1).atTime(19, 0);

        int[] rank = {100};
        return spaces.stream()
            .filter(space -> preferredSpaceId == null || preferredSpaceId.equals(space.getSpaceId()))
            .map(space -> toItem(space, baseStart, duration, rank))
            .filter(item -> item != null)
            .toList();
    }

    private Map<String, Object> toItem(
        SpaceResponse space,
        LocalDateTime baseStart,
        Duration duration,
        int[] rank
    ) {
        LocalDateTime slotStart = findAvailableSlot(space.getSpaceId(), baseStart, duration);
        if (slotStart == null) {
            return null;
        }
        LocalDateTime slotEnd = slotStart.plus(duration);

        Map<String, Object> item = new HashMap<>();
        item.put("space_id", space.getSpaceId());
        item.put("space_name", space.getSpaceNm());
        item.put("building_id", space.getBuildingId());
        item.put("start_at", slotStart.toString());
        item.put("end_at", slotEnd.toString());
        item.put("score", Math.max(rank[0], 1));
        rank[0] -= 5;
        return item;
    }

    private LocalDateTime findAvailableSlot(Integer spaceId, LocalDateTime baseStart, Duration duration) {
        if (spaceId == null) {
            return null;
        }

        LocalDateTime candidate = baseStart;
        for (int i = 0; i < 6; i++) {
            LocalDateTime end = candidate.plus(duration);
            boolean conflict = spaceReservationRepository.existsSpaceTimeConflict(
                spaceId,
                INACTIVE_STATUSES,
                candidate,
                end
            );
            if (!conflict) {
                return candidate;
            }
            candidate = candidate.plusHours(1);
        }
        return null;
    }

    private Duration reservationDuration(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && end.isAfter(start)) {
            Duration candidate = Duration.between(start, end);
            if (!candidate.isNegative() && !candidate.isZero()) {
                return candidate;
            }
        }
        return Duration.ofHours(1);
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

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.replace("Z", ""));
        } catch (Exception e) {
            return null;
        }
    }
}
