package org.myweb.uniplace.domain.ai.application.usecase;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.myweb.uniplace.domain.community.repository.BoardRepository;
import org.myweb.uniplace.domain.support.domain.entity.Faq;
import org.myweb.uniplace.domain.support.domain.entity.Notice;
import org.myweb.uniplace.domain.support.repository.FaqRepository;
import org.myweb.uniplace.domain.support.repository.NoticeRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CommunityContentUseCase extends AbstractForwardUseCase {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final BoardRepository boardRepository;
    private final NoticeRepository noticeRepository;
    private final FaqRepository faqRepository;

    public CommunityContentUseCase(
        AiGateway aiGateway,
        BoardRepository boardRepository,
        NoticeRepository noticeRepository,
        FaqRepository faqRepository
    ) {
        super(aiGateway);
        this.boardRepository = boardRepository;
        this.noticeRepository = noticeRepository;
        this.faqRepository = faqRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) {
            slots.putAll(request.getSlots());
        }

        String keyword = firstNonBlank(
            stringSlot(slots, "keyword"),
            stringSlot(slots, "topic"),
            request.getPrompt()
        );
        String topic = normalizeTopic(stringSlot(slots, "topic"));
        Integer boardId = intSlot(slots, "boardId", "board_id");

        if (!hasSlot(slots, "items")) {
            slots.put("items", loadItems(keyword, topic, boardId));
        }
        if (!hasSlot(slots, "keyword") && keyword != null) {
            slots.put("keyword", keyword);
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
        return AiIntent.COMMUNITY_CONTENT_SEARCH;
    }

    private List<Map<String, Object>> loadItems(String keyword, String topic, Integer boardId) {
        List<Map<String, Object>> items = new ArrayList<>();
        items.addAll(loadBoardItems(keyword, topic, boardId));
        items.addAll(loadNoticeItems(keyword, topic));
        items.addAll(loadFaqItems(keyword, topic));
        return items;
    }

    private List<Map<String, Object>> loadBoardItems(String keyword, String topic, Integer boardId) {
        List<Board> boards;
        if (boardId != null) {
            Board board = boardRepository.findById(boardId).orElse(null);
            boards = board == null ? List.of() : List.of(board);
        } else if ("popular".equalsIgnoreCase(stringSlotValue(topic, keyword))) {
            boards = boardRepository.findWeeklyTop(LocalDateTime.now().minusDays(7), PageRequest.of(0, 10));
        } else if (keyword != null && !keyword.isBlank()) {
            boards = boardRepository.searchByTitle(mapBoardCode(topic), keyword, PageRequest.of(0, 10)).getContent();
        } else if (topic != null) {
            String code = mapBoardCode(topic);
            if (code != null) {
                boards = boardRepository.findByCodeOrderByBoardIdDesc(code, PageRequest.of(0, 10)).getContent();
            } else {
                boards = boardRepository.findBoardListOrdered(LocalDateTime.now(), PageRequest.of(0, 10)).getContent();
            }
        } else {
            boards = boardRepository.findBoardListOrdered(LocalDateTime.now(), PageRequest.of(0, 10)).getContent();
        }

        return boards.stream().map(board -> {
            Map<String, Object> item = new HashMap<>();
            item.put("source_type", "BOARD");
            item.put("source_id", board.getBoardId());
            item.put("title", board.getBoardTitle());
            item.put("content", board.getBoardCtnt());
            item.put("code", board.getCode());
            item.put("updated_at", board.getUpdatedAt() != null ? DATE_FMT.format(board.getUpdatedAt()) : null);
            item.put("version", board.getUpdatedAt() != null ? DATE_FMT.format(board.getUpdatedAt()) : "v1");
            item.put("score", board.getReadCount());
            return item;
        }).toList();
    }

    private List<Map<String, Object>> loadNoticeItems(String keyword, String topic) {
        if (topic != null && !"notice".equalsIgnoreCase(topic) && !"policy".equalsIgnoreCase(topic)) {
            return List.of();
        }
        List<Notice> notices = noticeRepository.search(
            null,
            null,
            keyword,
            PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "updatedAt"))
        ).getContent();

        return notices.stream().map(notice -> {
            Map<String, Object> item = new HashMap<>();
            item.put("source_type", "NOTICE");
            item.put("source_id", notice.getNoticeId());
            item.put("title", notice.getNoticeTitle());
            item.put("content", notice.getNoticeCtnt());
            item.put("code", notice.getCode());
            item.put("updated_at", notice.getUpdatedAt() != null ? DATE_FMT.format(notice.getUpdatedAt()) : null);
            item.put("version", notice.getUpdatedAt() != null ? DATE_FMT.format(notice.getUpdatedAt()) : "v1");
            item.put("score", notice.getReadCount());
            return item;
        }).toList();
    }

    private List<Map<String, Object>> loadFaqItems(String keyword, String topic) {
        if (topic != null && !"faq".equalsIgnoreCase(topic) && !"qna".equalsIgnoreCase(topic)) {
            return List.of();
        }
        List<Faq> faqs = faqRepository.search(
            null,
            1,
            keyword,
            PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        return faqs.stream().map(faq -> {
            Map<String, Object> item = new HashMap<>();
            item.put("source_type", "FAQ");
            item.put("source_id", faq.getFaqId());
            item.put("title", faq.getFaqTitle());
            item.put("content", faq.getFaqCtnt());
            item.put("code", faq.getCode());
            item.put("updated_at", faq.getCreatedAt() != null ? DATE_FMT.format(faq.getCreatedAt()) : null);
            item.put("version", faq.getCreatedAt() != null ? DATE_FMT.format(faq.getCreatedAt()) : "v1");
            item.put("score", 0);
            return item;
        }).toList();
    }

    private String mapBoardCode(String topic) {
        if (topic == null) {
            return null;
        }
        return switch (topic.toLowerCase()) {
            case "review" -> "BOARD_REVIEW";
            case "question", "qna" -> "BOARD_QUESTION";
            case "notice" -> "BOARD_NOTICE";
            case "free" -> "BOARD_FREE";
            default -> null;
        };
    }

    private String normalizeTopic(String topic) {
        if (topic == null) {
            return null;
        }
        String normalized = topic.trim();
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

    private String stringSlot(Map<String, Object> slots, String key) {
        Object value = slotValue(slots, key);
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private String stringSlotValue(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private boolean hasSlot(Map<String, Object> slots, String key) {
        return slots.containsKey(key) && slots.get(key) != null;
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
