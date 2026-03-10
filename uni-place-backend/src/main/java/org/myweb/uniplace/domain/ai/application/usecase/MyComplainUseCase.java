package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.Comparator;
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
public class MyComplainUseCase extends AbstractForwardUseCase {

    private final ComplainRepository complainRepository;

    public MyComplainUseCase(AiGateway aiGateway, ComplainRepository complainRepository) {
        super(aiGateway);
        this.complainRepository = complainRepository;
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
        String sortBy      = strSlot(slots, "sort_by");
        String sortOrder   = strSlot(slots, "sort_order");
        int    limit       = intSlot(slots, "limit", 20);
        String compStRaw   = strSlot(slots, "comp_st");
        String importanceRaw = strSlot(slots, "importance");
        String keyword     = strSlot(slots, "comp_keyword", "keyword");

        // ── DB 조회 ───────────────────────────────────────────────────
        Sort sort = "asc".equalsIgnoreCase(sortOrder)
            ? Sort.by(Sort.Direction.ASC,  resolveCompSortCol(sortBy))
            : Sort.by(Sort.Direction.DESC, resolveCompSortCol(sortBy));

        List<Complain> complains = complainRepository.findByUserId(
            userId, PageRequest.of(0, 100, sort)).getContent();

        // ── 필터 ──────────────────────────────────────────────────────
        if (compStRaw != null) {
            try {
                ComplainStatus st = ComplainStatus.valueOf(compStRaw.toLowerCase());
                complains = complains.stream().filter(c -> st.equals(c.getCompSt())).toList();
            } catch (IllegalArgumentException ignored) {}
        }
        if (importanceRaw != null) {
            complains = complains.stream()
                .filter(c -> c.getImportance() != null &&
                             c.getImportance().name().equalsIgnoreCase(importanceRaw))
                .toList();
        }
        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.toLowerCase();
            complains = complains.stream()
                .filter(c -> (c.getCompTitle() != null && c.getCompTitle().toLowerCase().contains(kw))
                          || (c.getCompCtnt()  != null && c.getCompCtnt().toLowerCase().contains(kw)))
                .toList();
        }
        complains = complains.stream().limit(limit).toList();

        // ── items 직렬화 ──────────────────────────────────────────────
        slots.put("items", complains.stream().map(c -> {
            Map<String, Object> item = new HashMap<>();
            item.put("comp_id",    c.getCompId());
            item.put("title",      c.getCompTitle());
            item.put("content",    c.getCompCtnt());
            item.put("status",     c.getCompSt()       != null ? c.getCompSt().name()       : null);
            item.put("importance", c.getImportance()   != null ? c.getImportance().name()   : null);
            item.put("ai_reason",  c.getAiReason());
            item.put("created_at", c.getCreatedAt()    != null ? c.getCreatedAt().toString() : null);
            item.put("reply_ck",   c.getReplyCk());
            return item;
        }).toList());

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent()).userId(userId)
            .userSegment(request.getUserSegment()).prompt(request.getPrompt())
            .slots(slots).build());
    }

    @Override
    protected AiIntent getIntent() { return AiIntent.MY_COMPLAIN; }

    private String resolveCompSortCol(String sortBy) {
        return switch (sortBy == null ? "" : sortBy.toLowerCase()) {
            case "importance"  -> "importance";
            case "created_at"  -> "createdAt";
            default            -> "compId";
        };
    }

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