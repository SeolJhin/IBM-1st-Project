# AI/app/services/rag/generator.py
from app.config.settings import settings
from app.integrations.llm_client_gemini import chat_with_gemini
from app.integrations.llm_client_openai import chat_with_openai
from app.integrations.llm_client_watsonx import chat_with_watsonx
from app.schemas.ai_request import AiRequest
from app.services.orchestrator.llm_sanitizer import clean_function_call_text, is_structured_tool_text


def generate_answer(req: AiRequest, docs: list[str]) -> str:
    """LLM으로 답변 생성 — provider에 따라 groq/openai/watsonx/gemini 선택"""
    llm_answer = _generate_with_llm(req, docs)
    if llm_answer:
        # LLM이 tool call/JSON을 텍스트로 출력한 경우 정리
        sanitized = clean_function_call_text(llm_answer)
        if sanitized and not is_structured_tool_text(sanitized):
            return sanitized
        # 정리 후에도 구조화 텍스트면 폴백

    # LLM 실패 시 폴백
    if req.intent == "COMMUNITY_CONTENT_SEARCH":
        return _community_fallback(req, docs)
    return _general_fallback(req, docs)


def _generate_with_llm(req: AiRequest, docs: list[str]) -> str:
    provider = (settings.llm_provider or "gemini").strip().lower()
    if provider == "gemini":
        return chat_with_gemini(req, docs)
    if provider == "watsonx":
        return chat_with_watsonx(req, docs)
    if provider == "openai":
        return chat_with_openai(req, docs)
    # 기본값 gemini
    return chat_with_gemini(req, docs)


def _general_fallback(req: AiRequest, docs: list[str]) -> str:
    if docs:
        return f"참고 정보: {docs[0]}"
    question = (req.prompt or "").strip()
    if question:
        return f"'{question}'에 대해 더 자세한 내용은 고객센터에 문의해주세요."
    return "안내 가능한 정보를 찾지 못했습니다. 고객센터에 문의해주세요."


def _community_fallback(req: AiRequest, docs: list[str]) -> str:
    keyword = str(req.get_slot("keyword") or req.get_slot("topic") or "").strip()
    if docs:
        top = docs[:3]
        joined = " | ".join(top)
        return f"'{keyword}' 관련 커뮤니티 결과: {joined}" if keyword else f"커뮤니티 결과: {joined}"
    return f"'{keyword}'에 대한 커뮤니티 게시물을 찾지 못했습니다." if keyword else "관련 게시물을 찾지 못했습니다."