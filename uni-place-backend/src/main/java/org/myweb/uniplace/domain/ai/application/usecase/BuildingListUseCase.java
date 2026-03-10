package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingSummaryResponse;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 빌딩 목록 조회 UseCase.
 *
 * ─ 건물명 매칭 전략 ─────────────────────────────────────────
 * Java(Spring)에서 "유니플레이스B" = "Uniplace B" 같은 한글↔영문 매칭을
 * 하드코딩으로 처리하지 않습니다.
 *
 * 대신 DB 전체 건물 목록(available_building_names)을 Python에 함께 전달하면
 * LLM이 사용자 표현과 가장 가까운 건물명을 스스로 판단합니다.
 * → 오타, 한글 표기, 영문 표기 모두 자연스럽게 처리됩니다.
 */
@Component
public class BuildingListUseCase extends AbstractForwardUseCase {

    private final BuildingService buildingService;

    public BuildingListUseCase(AiGateway aiGateway, BuildingService buildingService) {
        super(aiGateway);
        this.buildingService = buildingService;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) slots.putAll(request.getSlots());

        // ── 구조적 필터 추출 (엘리베이터·주차는 명확한 값이라 Java에서 처리) ──
        String existElv    = extractElv(slots, request.getPrompt());
        Integer minParking = extractParking(slots, request.getPrompt());

        // ── keyword: Python이 명시적으로 extracted_slots에 넣어준 경우만 사용 ──
        // 건물명 파싱은 LLM에 위임하므로 Java에서 heuristic 파싱을 하지 않음
        String keyword = strSlot(slots, "keyword");

        // ── DB 조회 ──────────────────────────────────────────────────
        // 필터(엘베/주차)를 적용한 결과 + 전체 건물 목록 두 가지 조회
        List<BuildingSummaryResponse> filtered = buildingService
            .searchPageWithFilters(existElv, minParking, keyword, PageRequest.of(0, 100))
            .getContent();

        List<BuildingSummaryResponse> all = buildingService
            .searchPageWithFilters(null, null, null, PageRequest.of(0, 200))
            .getContent();

        // ── items: 필터 적용된 상세 정보 ────────────────────────────
        slots.put("items", filtered.stream().map(b -> {
            Map<String, Object> item = new HashMap<>();
            item.put("building_nm",      b.getBuildingNm());
            item.put("building_addr",    b.getBuildingAddr());
            item.put("building_desc",    b.getBuildingDesc() != null ? b.getBuildingDesc() : "");
            item.put("elv",              "Y".equals(b.getExistElv()));
            item.put("elv_text",         "Y".equals(b.getExistElv()) ? "있음" : "없음");
            item.put("parking",          b.getParkingCapacity() != null && b.getParkingCapacity() > 0);
            item.put("parking_capacity", b.getParkingCapacity() != null ? b.getParkingCapacity() : 0);
            item.put("land_category",    b.getLandCategory() != null ? b.getLandCategory() : "");
            item.put("build_size",       b.getBuildSize() != null ? b.getBuildSize().toPlainString() + "㎡" : "");
            item.put("building_usage",   b.getBuildingUsage() != null ? b.getBuildingUsage() : "");
            item.put("building_id",      b.getBuildingId());
            return item;
        }).toList());

        // ── available_building_names: DB 실제 건물명 전체 목록 ───────
        // Python LLM이 사용자 표현("유니플레이스B", "B건물" 등)과 이 목록을 비교해
        // 가장 적합한 건물을 직접 판단하게 합니다
        slots.put("available_building_names",
            all.stream()
               .map(BuildingSummaryResponse::getBuildingNm)
               .filter(nm -> nm != null && !nm.isBlank())
               .toList());

        // ── 적용된 필터 정보 ─────────────────────────────────────────
        Map<String, Object> appliedFilters = new HashMap<>();
        if (existElv != null)   appliedFilters.put("elv", existElv);
        if (minParking != null) appliedFilters.put("min_parking", minParking);
        if (!appliedFilters.isEmpty()) slots.put("applied_filters", appliedFilters);

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent())
            .userId(request.getUserId())
            .userSegment(request.getUserSegment())
            .prompt(request.getPrompt())
            .slots(slots)
            .build());
    }

    @Override
    protected AiIntent getIntent() { return AiIntent.BUILDING_LIST; }

    // ── 필터 헬퍼 ────────────────────────────────────────────────────

    /** 엘리베이터 조건: slots.elv_filter 우선, 없으면 prompt 파싱 */
    private String extractElv(Map<String, Object> slots, String prompt) {
        Object slotVal = slots.get("elv_filter");
        if (slotVal instanceof String s) {
            if ("Y".equalsIgnoreCase(s)) return "Y";
            if ("N".equalsIgnoreCase(s)) return "N";
        }
        if (prompt == null) return null;
        String p = prompt.toLowerCase();
        if (p.matches(".*엘리베이터.*(없|안돼|미설치).*") ||
            p.matches(".*(없는|없어).*엘리베이터.*")) return "N";
        if (p.contains("엘리베이터") || p.contains("엘베") || p.contains("승강기")) return "Y";
        return null;
    }

    /** 주차 조건: slots.min_parking 우선, 없으면 prompt 파싱 */
    private Integer extractParking(Map<String, Object> slots, String prompt) {
        Object slotVal = slots.get("min_parking");
        if (slotVal instanceof Number n) return n.intValue();
        if (prompt != null && prompt.toLowerCase().contains("주차")) return 1;
        return null;
    }

    private String strSlot(Map<String, Object> slots, String... keys) {
        for (String k : keys) {
            Object v = slots.get(k);
            if (v != null) {
                String s = v.toString().trim();
                if (!s.isEmpty()) return s;
            }
        }
        return null;
    }
}