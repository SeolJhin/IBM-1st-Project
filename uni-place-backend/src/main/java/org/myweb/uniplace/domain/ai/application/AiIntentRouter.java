package org.myweb.uniplace.domain.ai.application;

import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.application.usecase.AiUseCase;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiIntentRouter {

    private final List<AiUseCase> useCases;

    public AiIntentRouter(List<AiUseCase> useCases) {
        this.useCases = useCases;
    }

    public AiGatewayResponse route(AiGatewayRequest request) {
        if (request == null || request.getIntent() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        AiIntent targetIntent = request.getIntent();

        return useCases.stream()
            .filter(useCase -> useCase.supports(targetIntent))
            .findFirst()
            .map(useCase -> useCase.execute(request))
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));
    }
}
