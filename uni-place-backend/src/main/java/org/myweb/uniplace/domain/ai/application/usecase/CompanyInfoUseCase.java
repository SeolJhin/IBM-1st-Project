package org.myweb.uniplace.domain.ai.application.usecase;

import java.util.HashMap;
import java.util.Map;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.domain.system.api.dto.response.CompanyInfoResponse;
import org.myweb.uniplace.domain.system.application.CompanyInfoService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CompanyInfoUseCase extends AbstractForwardUseCase {

    private final CompanyInfoService companyInfoService;

    public CompanyInfoUseCase(AiGateway aiGateway, CompanyInfoService companyInfoService) {
        super(aiGateway);
        this.companyInfoService = companyInfoService;
    }

    @Override
    @Transactional(readOnly = true)
    public AiGatewayResponse execute(AiGatewayRequest request) {
        Map<String, Object> slots = new HashMap<>();
        if (request.getSlots() != null) slots.putAll(request.getSlots());

        try {
            CompanyInfoResponse info = companyInfoService.getLatest();
            Map<String, Object> company = new HashMap<>();
            company.put("company_nm", info.companyNm());
            company.put("company_ceo", info.companyCeo());
            company.put("company_tel", info.companyTel());
            company.put("company_email", info.companyEmail());
            company.put("company_addr", info.companyAddr());
            slots.put("company_info", company);
        } catch (Exception e) {
            slots.put("company_info", Map.of("error", "회사 정보를 불러올 수 없습니다."));
        }

        return super.execute(AiGatewayRequest.builder()
            .intent(request.getIntent())
            .userId(request.getUserId())
            .userSegment(request.getUserSegment())
            .prompt(request.getPrompt())
            .slots(slots)
            .build());
    }

    @Override
    protected AiIntent getIntent() { return AiIntent.COMPANY_INFO; }
}