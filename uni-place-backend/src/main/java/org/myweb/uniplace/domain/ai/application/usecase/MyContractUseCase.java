package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.Comparator;
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
public class MyContractUseCase extends AbstractForwardUseCase {

    private final ContractRepository contractRepository;

    public MyContractUseCase(AiGateway aiGateway, ContractRepository contractRepository) {
        super(aiGateway);
        this.contractRepository = contractRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) slots.putAll(request.getSlots());

        String userId = request.getUserId();
        if (userId == null || userId.isBlank()) {
            return super.execute(AiGatewayRequest.builder()
                .intent(request.getIntent()).userId(null)
                .userSegment(request.getUserSegment()).prompt(request.getPrompt())
                .slots(Map.of("auth_required", true)).build());
        }

        // ── 슬롯 추출 ─────────────────────────────────────────────────
        String sortBy    = strSlot(slots, "sort_by");
        String sortOrder = strSlot(slots, "sort_order");
        int    limit     = intSlot(slots, "limit", 20);
        String contractStRaw = strSlot(slots, "contract_st");

        // ── DB 조회 + 필터 ────────────────────────────────────────────
        List<Contract> contracts = contractRepository.findMyContracts(userId);

        if (contractStRaw != null) {
            try {
                ContractStatus st = ContractStatus.valueOf(contractStRaw.toLowerCase());
                contracts = contracts.stream().filter(c -> st.equals(c.getContractSt())).toList();
            } catch (IllegalArgumentException ignored) {}
        }

        // ── 정렬 ──────────────────────────────────────────────────────
        boolean asc = "asc".equalsIgnoreCase(sortOrder);
        Comparator<Contract> cmp = switch (sortBy == null ? "" : sortBy.toLowerCase()) {
            case "rent_price"     -> Comparator.comparing(c -> c.getRentPrice() != null ? c.getRentPrice().intValue() : 0);
            case "contract_start" -> Comparator.comparing(c -> c.getContractStart() != null ? c.getContractStart().toString() : "");
            case "contract_end"   -> Comparator.comparing(c -> c.getContractEnd()   != null ? c.getContractEnd().toString()   : "");
            default               -> Comparator.comparing(c -> c.getCreatedAt()     != null ? c.getCreatedAt().toString()     : "");
        };
        if (!asc) cmp = cmp.reversed();
        contracts = contracts.stream().sorted(cmp).limit(limit).toList();

        // ── items 직렬화 ──────────────────────────────────────────────
        slots.put("items", contracts.stream().map(c -> {
            Map<String, Object> item = new HashMap<>();
            item.put("contract_id",    c.getContractId());
            item.put("contract_st",    c.getContractSt()    != null ? c.getContractSt().name()    : null);
            item.put("contract_start", c.getContractStart() != null ? c.getContractStart().toString() : null);
            item.put("contract_end",   c.getContractEnd()   != null ? c.getContractEnd().toString()   : null);
            item.put("rent_price",     c.getRentPrice()     != null ? c.getRentPrice().intValue()      : null);
            item.put("deposit",        c.getDeposit()       != null ? c.getDeposit().intValue()        : null);
            item.put("manage_fee",     c.getManageFee()     != null ? c.getManageFee().intValue()      : null);
            item.put("payment_day",    c.getPaymentDay());
            item.put("rent_type",      c.getRentType()      != null ? c.getRentType().name()      : null);
            if (c.getRoom() != null) {
                item.put("room_no", c.getRoom().getRoomNo());
                item.put("room_type", c.getRoom().getRoomType() != null ? c.getRoom().getRoomType().name() : null);
                if (c.getRoom().getBuilding() != null) {
                    item.put("building_nm",   c.getRoom().getBuilding().getBuildingNm());
                    item.put("building_addr", c.getRoom().getBuilding().getBuildingAddr());
                }
            }
            return item;
        }).toList());

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent()).userId(userId)
            .userSegment(request.getUserSegment()).prompt(request.getPrompt())
            .slots(slots).build());
    }

    @Override
    protected AiIntent getIntent() { return AiIntent.MY_CONTRACT; }

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