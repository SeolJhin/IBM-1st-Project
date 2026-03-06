package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class ComplainPriorityRequest {

    private String compTitle;
    private String compCtnt;
    private String compSt;
    private String keyword;
    private Double priorityScore;

    public AiIntent getIntent() {
        return AiIntent.COMPLAIN_PRIORITY_CLASSIFY;
    }
}
