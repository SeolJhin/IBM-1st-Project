package org.myweb.uniplace.domain.ai.application.moderation;

import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class BannedWordServiceImpl implements BannedWordService {

    private final List<String> bannedWords = new ArrayList<>();

    @PostConstruct
    public void load() {

        try {
            ClassPathResource resource = new ClassPathResource("ai/banned_words.txt");

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)
            );

            String line;

            while ((line = reader.readLine()) != null) {

                line = line.trim();

                if (line.isBlank() || line.startsWith("#")) {
                    continue;
                }

                bannedWords.add(line);
            }

        } catch (Exception e) {
            throw new RuntimeException("금지어 파일 로딩 실패", e);
        }
    }

    @Override
    public String filter(String content) {

        if (content == null) {
            return null;
        }

        String result = content;

        for (String word : bannedWords) {
            result = result.replaceAll("(?i)" + word + "[a-zA-Z가-힣]*", "***");
        }

        return result;
    }
}