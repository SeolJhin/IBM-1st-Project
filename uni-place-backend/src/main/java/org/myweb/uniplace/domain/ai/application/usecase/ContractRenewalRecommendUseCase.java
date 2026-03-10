package org.myweb.uniplace.domain.ai.application.usecase;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.application.RoomService;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ContractRenewalRecommendUseCase extends AbstractForwardUseCase {

    private final RoomService roomService;
    private final ContractRepository contractRepository;

    public ContractRenewalRecommendUseCase(
        AiGateway aiGateway,
        RoomService roomService,
        ContractRepository contractRepository
    ) {
        super(aiGateway);
        this.roomService = roomService;
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
        if (userId == null || userId.isBlank()) {
            userId = stringSlot(slots, "userId", "user_id");
        }

        Contract activeContract = resolveActiveContract(userId);
        fillMissingContractSlots(slots, activeContract);

        Integer buildingId = intSlot(slots, "buildingId", "building_id");
        Integer rentPrice = intSlot(slots, "rentPrice", "rent_price");
        slots.put("items", fetchRenewalItems(buildingId, rentPrice));

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
        return AiIntent.CONTRACT_RENEWAL_RECOMMEND;
    }

    private Contract resolveActiveContract(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        List<Contract> activeContracts = contractRepository.findActiveContractsWithRoomAndBuilding(
            userId,
            ContractStatus.active,
            LocalDate.now()
        );
        return activeContracts.isEmpty() ? null : activeContracts.get(0);
    }

    private void fillMissingContractSlots(Map<String, Object> slots, Contract activeContract) {
        if (activeContract == null) {
            return;
        }

        if (slotValue(slots, "contractEnd", "contract_end") == null && activeContract.getContractEnd() != null) {
            slots.put("contractEnd", activeContract.getContractEnd().toString());
        }
        if (slotValue(slots, "buildingId", "building_id") == null
            && activeContract.getRoom() != null
            && activeContract.getRoom().getBuilding() != null
            && activeContract.getRoom().getBuilding().getBuildingId() != null) {
            slots.put("buildingId", activeContract.getRoom().getBuilding().getBuildingId());
        }
        if (slotValue(slots, "rentPrice", "rent_price") == null && activeContract.getRentPrice() != null) {
            slots.put("rentPrice", activeContract.getRentPrice().intValue());
        }
        if (slotValue(slots, "roomId", "room_id") == null && activeContract.getRoom() != null) {
            slots.put("roomId", activeContract.getRoom().getRoomId());
        }
    }

    private List<Map<String, Object>> fetchRenewalItems(Integer buildingId, Integer rentPrice) {
        Integer range = 200000;
        BigDecimal minRent = rentPrice == null ? null : BigDecimal.valueOf(Math.max(0, rentPrice - range));
        BigDecimal maxRent = rentPrice == null ? null : BigDecimal.valueOf(rentPrice + range);

        org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest roomSearchRequest =
            org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest.builder()
                .buildingId(buildingId)
                .minRentPrice(minRent)
                .maxRentPrice(maxRent)
                .roomSt(RoomStatus.available)
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
        item.put("building_id", room.getBuildingId());
        item.put("rent_price", room.getRentPrice() != null ? room.getRentPrice().intValue() : null);
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
}
