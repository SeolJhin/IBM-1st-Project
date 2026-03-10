package org.myweb.uniplace.domain.ai.application.moderation;

public interface BannedWordService {

    String filter(String content);

}