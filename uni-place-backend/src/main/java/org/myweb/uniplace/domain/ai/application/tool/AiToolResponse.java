package org.myweb.uniplace.domain.ai.application.tool;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiToolResponse {

    private boolean success;
    private List<Map<String, Object>> data;
    private Map<String, Object> meta;
    private String error;

    public static AiToolResponse ok(List<Map<String, Object>> data) {
        return AiToolResponse.builder().success(true).data(data)
                .meta(Map.of("total", data.size())).build();
    }

    public static AiToolResponse ok(List<Map<String, Object>> data, Map<String, Object> meta) {
        return AiToolResponse.builder().success(true).data(data).meta(meta).build();
    }

    public static AiToolResponse fail(String error) {
        return AiToolResponse.builder().success(false).error(error).build();
    }

    public static AiToolResponse authRequired() {
        return AiToolResponse.builder().success(false).error("AUTH_REQUIRED").build();
    }
}
