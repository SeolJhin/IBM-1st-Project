CONTRACT_VERSION = "2026-03-08.3"

# Intent contract is intentionally explicit to reduce drift between Spring and FastAPI.
INTENT_CONTRACT: dict[str, dict[str, object]] = {
    "GENERAL_QA": {
        "endpoint": "/api/v1/ai/chat/general-qa",
        "required": ["prompt"],
        "optional": ["userId", "userSegment", "slots.topic", "slots.keyword"],
    },
    "AI_AGENT_CHATBOT": {
        "endpoint": "/api/v1/ai/chat/agent-chatbot",
        "required": ["prompt"],
        "optional": ["userId", "userSegment", "topic", "keyword", "slots.*"],
    },
    "VOICE_CHATBOT": {
        "endpoint": "/api/v1/ai/chat/voice-assistant",
        "required": [],
        "optional": ["userId", "prompt", "audioPath", "audioBase64", "ttsEnabled", "voiceLocale", "slots.*"],
    },
    "AI_AGENT_RAG_SEARCH": {
        "endpoint": "/api/v1/ai/search/rag",
        "required": [],
        "optional": ["userId", "query", "topic", "keyword", "slots.*"],
    },
    "COMMUNITY_CONTENT_SEARCH": {
        "endpoint": "/api/v1/ai/community/content-search",
        "required": [],
        "optional": ["userId", "userSegment", "topic", "keyword", "sort", "boardId", "slots.*"],
    },
    "COMMUNITY_CONTENT_MODERATION": {
        "endpoint": "/api/v1/ai/community/content-moderation",
        "required": ["content"],
        "optional": ["userId", "authorId", "boardId", "slots.*"],
    },
    "CONTRACT_RENEWAL_RECOMMEND": {
        "endpoint": "/api/v1/ai/contracts/renewal-recommendations",
        "required": [],
        "optional": ["userId", "contractEnd", "roomId", "rentPrice", "buildingId", "slots.*"],
    },
    "CONTRACT_ANOMALY_DETECTION": {
        "endpoint": "/api/v1/ai/contracts/anomaly-detections",
        "required": [],
        "optional": ["userId", "contractCount", "contractSt", "createdAt", "patternScore", "items", "slots.*"],
    },
    "ROOM_AVAILABILITY_SEARCH": {
        "endpoint": "/api/v1/ai/rooms/availability-searches",
        "required": [],
        "optional": [
            "userId",
            "checkInDate",
            "checkOutDate",
            "buildingAddr",
            "roomType",
            "rentPrice",
            "roomCapacity",
            "petAllowedYn",
            "option",
            "slots.*",
        ],
    },
    "COMMON_SPACE_RECOMMEND": {
        "endpoint": "/api/v1/ai/common-spaces/recommendations",
        "required": [],
        "optional": ["userId", "spaceId", "buildingId", "srStartAt", "srEndAt", "usagePattern", "slots.*"],
    },
    "PAYMENT_SUMMARY_DOCUMENT": {
        "endpoint": "/api/v1/ai/payments/summary-documents",
        "required": [],
        "optional": ["userId", "month", "paymentId", "totalPrice", "paidAt", "targetType", "slots.*"],
    },
    "PAYMENT_STATUS_SUMMARY": {
        "endpoint": "/api/v1/ai/payments/status-summaries",
        "required": [],
        "optional": ["userId", "billingMonth", "paymentSt", "chargeStatus", "dueDate", "slots.*"],
    },
    "PAYMENT_ORDER_SUGGESTION": {
        "endpoint": "/api/v1/ai/payments/order-suggestions",
        "required": [],
        "optional": ["userId", "buildingId", "month", "items", "slots.*"],
    },
    "ROOMSERVICE_STOCK_MONITOR": {
        "endpoint": "/api/v1/ai/operations/roomservice-stock-monitoring",
        "required": [],
        "optional": ["buildingId", "prodId", "prodNm", "prodStock", "affiliateId", "items", "slots.*"],
    },
    "COMPLAIN_PRIORITY_CLASSIFY": {
        "endpoint": "/api/v1/ai/operations/complaint-priority-classification",
        "required": [],
        "optional": ["userId", "compId", "compTitle", "compCtnt", "compSt", "keyword", "priorityScore", "items", "slots.*"],
    },
}
