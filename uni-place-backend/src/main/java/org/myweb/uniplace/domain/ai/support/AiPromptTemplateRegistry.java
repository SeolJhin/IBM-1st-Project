package org.myweb.uniplace.domain.ai.support;

import java.util.EnumMap;
import java.util.Map;

import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

@Component
public class AiPromptTemplateRegistry {

    private final Map<AiIntent, String> templates = new EnumMap<>(AiIntent.class);

    public AiPromptTemplateRegistry() {
        templates.put(AiIntent.GENERAL_QA, "general_qa_prompt");
        templates.put(AiIntent.CONTRACT_RENEWAL_RECOMMEND, "contract_renewal_recommend_prompt");
        templates.put(AiIntent.CONTRACT_ANOMALY_DETECTION, "contract_anomaly_detection_prompt");
        templates.put(AiIntent.ROOM_AVAILABILITY_SEARCH, "room_availability_search_prompt");
        templates.put(AiIntent.PAYMENT_SUMMARY_DOCUMENT, "payment_summary_document_prompt");
        templates.put(AiIntent.PAYMENT_STATUS_SUMMARY, "payment_status_summary_prompt");
        templates.put(AiIntent.ROOMSERVICE_STOCK_MONITOR, "roomservice_stock_monitor_prompt");
        templates.put(AiIntent.COMMON_SPACE_RECOMMEND, "common_space_recommend_prompt");
        templates.put(AiIntent.COMMUNITY_CONTENT_SEARCH, "community_content_search_prompt");
        templates.put(AiIntent.COMPLAIN_PRIORITY_CLASSIFY, "complain_priority_classify_prompt");
    }

    public String getTemplateKey(AiIntent intent) {
        return templates.get(intent);
    }
}
