# app/services/orchestrator/workflow_graph.py
"""
WorkflowGraph — tool_orchestrator로 교체.

[기존 구조의 문제]
  AI_AGENT_CHATBOT 수신
    → intent 재분류 (LLM 호출 #1)
    → BUILDING_LIST 등 DB 의존 intent면 answer="" 로 Spring에 반환
    → Spring이 각 UseCase로 재호출 (2-step 왕복)
    → 두 번째 Python 호출에서 답변 생성 (LLM 호출 #2)

이 구조 때문에:
  - 로그인 정보(userId)가 첫 번째 분류 단계에서 소실됨
  - "로그인이 필요합니다" 오답 발생
  - LLM 2회 호출로 느림

[변경 구조]
  모든 챗봇 요청 → tool_orchestrator 단일 처리
    → LLM이 DB 스키마 보고 SQL 직접 생성 (tool 선택)
    → Spring AiToolController에서 DB 조회 (역방향 호출)
    → LLM이 결과로 최종 답변 생성
  
  Spring 재호출(2-step) 불필요 → 1-step으로 단순화
"""
import logging

from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.orchestrator.intent_router import IntentRouter
from app.services.orchestrator.tool_orchestrator import run_tool_orchestrator

logger = logging.getLogger(__name__)

# tool_orchestrator가 처리하는 intent (챗봇 계열 전부)
_TOOL_ORCHESTRATOR_INTENTS = {
    "AI_AGENT_CHATBOT",
    "VOICE_CHATBOT",
    "GENERAL_QA",
    # 기존에 Spring 2-step이 필요했던 것들도 이제 tool_orchestrator가 직접 처리
    "BUILDING_LIST",
    "ROOM_AVAILABILITY_SEARCH",
    "REVIEW_INFO",
    "TOUR_INFO",
    "COMPANY_INFO",
    "MY_CONTRACT",
    "MY_RESERVATION",
    "MY_TOUR",
    "MY_COMPLAIN",
    "COMMUNITY_CONTENT_SEARCH",
    "ROOMSERVICE_STOCK_MONITOR",
    "CONTRACT_RENEWAL_RECOMMEND",
    "COMMON_SPACE_RECOMMEND",
}


class WorkflowGraph:
    def __init__(self) -> None:
        self.router = IntentRouter()

    def run(self, req: AiRequest) -> AiResponse:
        intent = (req.intent or "").strip().upper()

        # 챗봇 계열 → tool_orchestrator로 직접 처리 (1-step)
        if intent in _TOOL_ORCHESTRATOR_INTENTS:
            logger.info("[WorkflowGraph] tool_orchestrator 처리: intent=%s user_id=%s",
                        intent, req.user_id)
            return run_tool_orchestrator(req)

        # 관리자용 분석 기능 등 → 기존 IntentRouter 유지
        logger.info("[WorkflowGraph] IntentRouter 처리: intent=%s", intent)
        return self.router.route(req)
