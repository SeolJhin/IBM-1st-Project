# AI API Contract (Spring -> FastAPI)

Contract version: `2026-03-08.3`

This document is the single source of truth for intent-to-endpoint mapping.

## Endpoint mapping

| Intent | Spring endpoint | FastAPI endpoint | Notes |
|---|---|---|---|
| `GENERAL_QA` | `/ai/chat` | `/api/v1/ai/chat/general-qa` | `prompt` required |
| `AI_AGENT_CHATBOT` | `/ai/chat/agent-chatbot` | `/api/v1/ai/chat/agent-chatbot` | chatbot mode |
| `VOICE_CHATBOT` | `/ai/chat/voice` | `/api/v1/ai/chat/voice-assistant` | faster-whisper + melotts |
| `AI_AGENT_RAG_SEARCH` | `/ai/search/rag` | `/api/v1/ai/search/rag` | rag search mode |
| `COMMUNITY_CONTENT_SEARCH` | `/ai/community/search` | `/api/v1/ai/community/content-search` | topic/keyword/search |
| `COMMUNITY_CONTENT_MODERATION` | `/ai/community/moderate` | `/api/v1/ai/community/content-moderation` | profanity/slander/political filter |
| `CONTRACT_RENEWAL_RECOMMEND` | `/ai/contract/recommend` | `/api/v1/ai/contracts/renewal-recommendations` | contract end + pricing slots |
| `CONTRACT_ANOMALY_DETECTION` | `/ai/contract/anomaly` | `/api/v1/ai/contracts/anomaly-detections` | anomaly score/count slots |
| `ROOM_AVAILABILITY_SEARCH` | `/ai/room/search` | `/api/v1/ai/rooms/availability-searches` | check-in/out + room filters |
| `COMMON_SPACE_RECOMMEND` | `/ai/common-space/recommend` | `/api/v1/ai/common-spaces/recommendations` | space + time slots |
| `PAYMENT_SUMMARY_DOCUMENT` | `/ai/payment/summary` | `/api/v1/ai/payments/summary-documents` | summary document text |
| `PAYMENT_STATUS_SUMMARY` | `/ai/payment/status` | `/api/v1/ai/payments/status-summaries` | payment status text |
| `PAYMENT_ORDER_SUGGESTION` | `/ai/payment/order-suggestion` | `/api/v1/ai/payments/order-suggestions` | payment-based purchase draft |
| `ROOMSERVICE_STOCK_MONITOR` | `/ai/roomservice/stock` | `/api/v1/ai/operations/roomservice-stock-monitoring` | stock shortage detection |
| `COMPLAIN_PRIORITY_CLASSIFY` | `/ai/complain/priority` | `/api/v1/ai/operations/complaint-priority-classification` | priority scoring |

## Payload compatibility rules

1. Spring sends `AiGatewayRequest` with camelCase fields.
2. FastAPI accepts both top-level fields and nested `slots`.
3. FastAPI normalizes slot names by snake_case/camelCase (`get_slot`).
4. Spring sends `X-AI-Contract-Version` header for version tracking.
5. FastAPI exposes `/api/v1/ai/contract` for contract introspection.
