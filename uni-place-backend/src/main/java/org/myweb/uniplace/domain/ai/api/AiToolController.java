package org.myweb.uniplace.domain.ai.api;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.ai.application.tool.AiToolExecutor;
import org.myweb.uniplace.domain.ai.application.tool.AiToolRequest;
import org.myweb.uniplace.domain.ai.application.tool.AiToolResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AI Tool 실행 컨트롤러 — 내부 서버 간 통신 전용.
 *
 * Python tool_orchestrator → 여기서 DB 조회 → 결과 반환.
 *
 * [보안] 이 엔드포인트는 외부에 노출되면 안 됩니다.
 * SecurityConfig에서 내부 IP 또는 X-Internal-Token으로 보호하세요.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ai/tools")
@RequiredArgsConstructor
public class AiToolController {

    private final AiToolExecutor toolExecutor;

    @PostMapping("/execute")
    public ResponseEntity<AiToolResponse> execute(@RequestBody AiToolRequest request) {
        log.info("[AiToolController] tool={} userId={}", request.getTool(), request.getUserId());

        AiToolResponse response = toolExecutor.execute(request);

        if (!response.isSuccess() && "AUTH_REQUIRED".equals(response.getError())) {
            return ResponseEntity.status(401).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
