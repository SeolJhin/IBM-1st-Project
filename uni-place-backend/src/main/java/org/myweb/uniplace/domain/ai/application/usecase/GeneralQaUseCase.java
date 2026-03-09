package org.myweb.uniplace.domain.ai.application.usecase;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.support.domain.entity.Faq;
import org.myweb.uniplace.domain.support.domain.entity.Notice;
import org.myweb.uniplace.domain.support.repository.FaqRepository;
import org.myweb.uniplace.domain.support.repository.NoticeRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class GeneralQaUseCase extends AbstractForwardUseCase {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final FaqRepository faqRepository;
    private final NoticeRepository noticeRepository;

    public GeneralQaUseCase(
        AiGateway aiGateway,
        FaqRepository faqRepository,
        NoticeRepository noticeRepository
    ) {
        super(aiGateway);
        this.faqRepository = faqRepository;
        this.noticeRepository = noticeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        String query = firstNonBlank(
            request.getPrompt(),
            stringSlot(slots, "keyword"),
            stringSlot(slots, "topic")
        );
        if (!hasSlot(slots, "items")) {
            slots.put("items", loadKnowledgeItems(query));
        }
        if (!hasSlot(slots, "keyword") && query != null) {
            slots.put("keyword", query);
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
        return AiIntent.GENERAL_QA;
    }

    private List<Map<String, Object>> loadKnowledgeItems(String query) {
        List<Map<String, Object>> items = new ArrayList<>();
        List<Faq> faqs = faqRepository.search(
            null,
            1,
            normalizeKeyword(query),
            PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        for (Faq faq : faqs) {
            Map<String, Object> item = new HashMap<>();
            item.put("source_type", "FAQ");
            item.put("source_id", faq.getFaqId());
            item.put("title", faq.getFaqTitle());
            item.put("content", faq.getFaqCtnt());
            item.put("code", faq.getCode());
            item.put("updated_at", faq.getCreatedAt() != null ? DATE_FMT.format(faq.getCreatedAt()) : null);
            item.put("version", faq.getCreatedAt() != null ? DATE_FMT.format(faq.getCreatedAt()) : "v1");
            items.add(item);
        }

        List<Notice> notices = noticeRepository.search(
            null,
            null,
            normalizeKeyword(query),
            PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "updatedAt"))
        ).getContent();

        for (Notice notice : notices) {
            Map<String, Object> item = new HashMap<>();
            item.put("source_type", "NOTICE");
            item.put("source_id", notice.getNoticeId());
            item.put("title", notice.getNoticeTitle());
            item.put("content", notice.getNoticeCtnt());
            item.put("code", notice.getCode());
            item.put("updated_at", notice.getUpdatedAt() != null ? DATE_FMT.format(notice.getUpdatedAt()) : null);
            item.put("version", notice.getUpdatedAt() != null ? DATE_FMT.format(notice.getUpdatedAt()) : "v1");
            items.add(item);
        }
        return items;
    }

    private boolean hasSlot(Map<String, Object> slots, String key) {
        return slots.containsKey(key) && slots.get(key) != null;
    }

    private String stringSlot(Map<String, Object> slots, String key) {
        if (!slots.containsKey(key)) {
            return null;
        }
        Object value = slots.get(key);
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private String normalizeKeyword(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
