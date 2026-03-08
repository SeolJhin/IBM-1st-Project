package org.myweb.uniplace.domain.ai.application.usecase;

import java.time.LocalDateTime;
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
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ContractAnomalyUseCase extends AbstractForwardUseCase {

    private final ContractRepository contractRepository;

    public ContractAnomalyUseCase(AiGateway aiGateway, ContractRepository contractRepository) {
        super(aiGateway);
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

        List<Contract> history = fetchContractHistory(userId);
        if (!history.isEmpty()) {
            putIfMissing(slots, "contractCount", history.size(), "contract_count");
            putIfMissing(slots, "contractSt", history.get(0).getContractSt().name(), "contract_st");

            LocalDateTime latestAt = history.get(0).getCreatedAt();
            if (latestAt != null) {
                putIfMissing(slots, "createdAt", latestAt.toString(), "created_at");
            }

            if (!hasSlot(slots, "items")) {
                slots.put("items", toItems(history));
            }

            if (!hasSlot(slots, "patternScore", "pattern_score")) {
                slots.put("patternScore", estimatePatternScore(history));
            }
        }

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
        return AiIntent.CONTRACT_ANOMALY_DETECTION;
    }

    private List<Contract> fetchContractHistory(String userId) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }
        return contractRepository.findMyContracts(userId).stream()
            .limit(30)
            .toList();
    }

    private List<Map<String, Object>> toItems(List<Contract> history) {
        return history.stream()
            .map(contract -> {
                Map<String, Object> item = new HashMap<>();
                item.put("contract_id", contract.getContractId());
                item.put("contract_st", contract.getContractSt() != null ? contract.getContractSt().name() : null);
                item.put("created_at", contract.getCreatedAt() != null ? contract.getCreatedAt().toString() : null);
                item.put("room_id", contract.getRoom() != null ? contract.getRoom().getRoomId() : null);
                return item;
            })
            .toList();
    }

    private double estimatePatternScore(List<Contract> history) {
        if (history.isEmpty()) {
            return 0.35;
        }

        int total = history.size();
        LocalDateTime now = LocalDateTime.now();
        int within24h = 0;
        int within1h = 0;
        int requestedLike = 0;
        int nightCount = 0;

        for (Contract contract : history) {
            ContractStatus status = contract.getContractSt();
            if (status == ContractStatus.requested || status == ContractStatus.approved) {
                requestedLike++;
            }

            LocalDateTime createdAt = contract.getCreatedAt();
            if (createdAt == null) {
                continue;
            }

            if (!createdAt.isBefore(now.minusHours(24))) {
                within24h++;
            }
            if (!createdAt.isBefore(now.minusHours(1))) {
                within1h++;
            }

            int hour = createdAt.getHour();
            if (hour <= 5) {
                nightCount++;
            }
        }

        double score = 0.22;
        if (total >= 5) {
            score += 0.12;
        }
        if (total >= 10) {
            score += 0.13;
        }
        if (within24h >= 3) {
            score += 0.2;
        }
        if (within1h >= 2) {
            score += 0.15;
        }

        double requestedRatio = total == 0 ? 0.0 : (double) requestedLike / total;
        if (requestedRatio >= 0.7) {
            score += 0.1;
        }

        double nightRatio = total == 0 ? 0.0 : (double) nightCount / total;
        if (nightRatio >= 0.5) {
            score += 0.08;
        }

        if (score < 0.0) {
            return 0.0;
        }
        return Math.min(score, 0.95);
    }

    private void putIfMissing(Map<String, Object> slots, String key, Object value, String... aliases) {
        if (value == null) {
            return;
        }
        if (!hasSlot(slots, key) && !hasSlot(slots, aliases)) {
            slots.put(key, value);
        }
    }

    private boolean hasSlot(Map<String, Object> slots, String... keys) {
        for (String key : keys) {
            if (slots.containsKey(key) && slots.get(key) != null) {
                return true;
            }
        }
        return false;
    }

    private String stringSlot(Map<String, Object> slots, String... keys) {
        for (String key : keys) {
            if (!slots.containsKey(key)) {
                continue;
            }
            Object value = slots.get(key);
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value).trim();
            if (!text.isEmpty()) {
                return text;
            }
        }
        return null;
    }
}
