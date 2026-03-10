package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class VoiceChatbotRequest {

    private String userId;
    private String userSegment;
    private String prompt;
    private String audioBase64;
    private String audioPath;
    private Boolean ttsEnabled;
    private String voiceLocale;

    public AiIntent getIntent() {
        return AiIntent.VOICE_CHATBOT;
    }
}
