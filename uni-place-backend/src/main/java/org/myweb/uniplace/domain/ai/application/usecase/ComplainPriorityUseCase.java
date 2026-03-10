package org.myweb.uniplace.domain.ai.application.usecase;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;
import org.myweb.uniplace.domain.support.repository.ComplainRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ComplainPriorityUseCase extends AbstractForwardUseCase {

    private final ComplainRepository complainRepository;

    public ComplainPriorityUseCase(AiGateway aiGateway, ComplainRepository complainRepository) {
        super(aiGateway);
        this.complainRepository = complainRepository;
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

        Integer compId = intSlot(slots, "compId", "comp_id");
        Complain target = resolveTargetComplain(compId, userId);
        if (target != null) {
            fillMissingFields(slots, target);
        }

        if (!hasSlot(slots, "items") && userId != null && !userId.isBlank()) {
            slots.put("items", loadRecentComplainItems(userId));
        }

        if (!hasSlot(slots, "priorityScore", "priority_score") && target != null) {
            slots.put("priorityScore", estimatePriorityScore(target, userId));
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
        return AiIntent.COMPLAIN_PRIORITY_CLASSIFY;
    }

    private Complain resolveTargetComplain(Integer compId, String userId) {
        if (compId != null) {
            return complainRepository.findById(compId).orElse(null);
        }
        if (userId == null || userId.isBlank()) {
            return null;
        }
        List<Complain> recent = complainRepository.findByUserId(
            userId,
            PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();
        return recent.isEmpty() ? null : recent.get(0);
    }

    private List<Map<String, Object>> loadRecentComplainItems(String userId) {
        return complainRepository.findByUserId(
            userId,
            PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent().stream()
            .map(complain -> {
                Map<String, Object> item = new HashMap<>();
                item.put("comp_id", complain.getCompId());
                item.put("comp_title", complain.getCompTitle());
                item.put("comp_ctnt", complain.getCompCtnt());
                item.put("comp_st", complain.getCompSt() != null ? complain.getCompSt().name() : null);
                item.put("created_at", complain.getCreatedAt() != null ? complain.getCreatedAt().toString() : null);
                item.put("reply_ck", complain.getReplyCk());
                item.put("code", complain.getCode());
                return item;
            })
            .toList();
    }

    private void fillMissingFields(Map<String, Object> slots, Complain complain) {
        putIfMissing(slots, "compId", complain.getCompId(), "comp_id");
        putIfMissing(slots, "compTitle", complain.getCompTitle(), "comp_title");
        putIfMissing(slots, "compCtnt", complain.getCompCtnt(), "comp_ctnt");
        if (complain.getCompSt() != null) {
            putIfMissing(slots, "compSt", complain.getCompSt().name(), "comp_st");
        }
        putIfMissing(slots, "keyword", complain.getCode());
    }

    private double estimatePriorityScore(Complain target, String userId) {
        double score = baseScore(target.getCompSt());
        String text = ((target.getCompTitle() == null ? "" : target.getCompTitle()) + " "
            + (target.getCompCtnt() == null ? "" : target.getCompCtnt())).toLowerCase();

        if (containsUrgentWord(text)) {
            score += 0.8;
        }
        if (text.contains("!")) {
            score += 0.2;
        }

        if (userId != null && !userId.isBlank()) {
            long unresolvedRecent = complainRepository.findByUserId(
                userId,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent().stream()
                .filter(complain -> complain.getCompSt() != ComplainStatus.resolved)
                .filter(complain -> isWithinDays(complain.getCreatedAt(), 7))
                .count();
            if (unresolvedRecent >= 3) {
                score += 0.5;
            } else if (unresolvedRecent >= 2) {
                score += 0.3;
            }
        }

        if (score < 1.0) {
            return 1.0;
        }
        return Math.min(score, 3.0);
    }

    private boolean isWithinDays(LocalDateTime createdAt, int days) {
        if (createdAt == null) {
            return false;
        }
        return !createdAt.isBefore(LocalDateTime.now().minusDays(days));
    }

    private boolean containsUrgentWord(String text) {
        return text.contains("urgent")
            || text.contains("asap")
            || text.contains("immediately")
            || text.contains("critical")
            || text.contains("emergency");
    }

    private double baseScore(ComplainStatus status) {
        if (status == null) {
            return 1.4;
        }
        return switch (status) {
            case received -> 2.0;
            case in_progress -> 1.7;
            case resolved -> 1.2;
        };
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

    private Integer intSlot(Map<String, Object> slots, String... keys) {
        for (String key : keys) {
            if (!slots.containsKey(key)) {
                continue;
            }
            Object value = slots.get(key);
            if (value == null) {
                continue;
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
        return null;
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
