package org.myweb.uniplace.domain.ai.domain;

import java.util.Map;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiContext {

    private String userId;
    private String userSegment;
    private String locale;
    private Map<String, Object> metadata;
}
