# app/services/orchestrator/tool_orchestrator.py
"""
AI Tool Calling Orchestrator — UNI PLACE 챗봇 핵심 엔진.

[하이브리드 구조]
- query_database  : LLM이 SQL 직접 생성 → Spring에서 실행 (로그인 불필요)
- query_my_data   : 개인 데이터 조회 (user_id 자동 주입, 로그인 필요)
- 전용 tool       : 투어 슬롯 계산, 민원 분류 등 비즈니스 로직 필요한 것

[Rate Limit Fallback]
Groq 429 오류 시 TPD 한도가 별도인 모델로 자동 전환:
  기본: llama-3.3-70b-versatile (100k TPD)
  1차:  llama-3.1-8b-instant    (500k TPD)
  2차:  gemma2-9b-it            (500k TPD)
  3차:  mixtral-8x7b-32768      (500k TPD)
"""
import json
import logging

from openai import OpenAI, RateLimitError

from app.config.settings import settings
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.tools.db_schema import DB_SCHEMA
from app.services.tools.tool_definitions import TOOL_DEFINITIONS, AUTH_REQUIRED_TOOLS
from app.services.tools.tool_executor import execute_tool
from app.services.tools.tool_result_formatter import format_tool_result

logger = logging.getLogger(__name__)

# Groq 429/400 시 순서대로 fallback 시도 (2026-03 기준 살아있는 모델)
# llama-3.1-8b-instant 는 tool calling을 텍스트로 섞어 반환하므로 제외
GROQ_FALLBACK_MODELS = [
    "meta-llama/llama-4-maverick-17b-128e-instruct",  # 500K TPD, tool calling 지원
    "meta-llama/llama-4-scout-17b-16e-instruct",      # 500K TPD, tool calling 지원
    "gemma2-9b-it",                                   # 500K TPD
    "mixtral-8x7b-32768",                             # 500K TPD
    # llama-3.1-8b-instant 은 tool calling을 텍스트로 섞어 반환하므로 제외
]

_SYSTEM_PROMPT = f"""당신은 UNI PLACE 주거 플랫폼의 AI 어시스턴트입니다.

[사용 가능한 도구]
1. query_database   — 공개 데이터 조회 (로그인 불필요)
   빌딩 목록/개수, 방 검색/개수, 리뷰, 공용 시설, 공지사항, FAQ, 회사 정보 등
   모든 일반 조회에 사용. SQL을 직접 작성하세요.

2. query_my_data    — 개인 데이터 조회 (로그인 필요)
   내 계약, 내 예약, 내 민원, 내 결제 내역.
   SQL에 반드시 WHERE user_id = '{{user_id}}' 포함.

3. get_tour_available_slots — 투어 가능 시간대 조회
4. classify_complain_priority — 민원 우선순위 분류

[도구 선택 원칙]
- 방/빌딩/리뷰 등 공개 데이터 → query_database (로그인 불필요)
- "내 계약", "내 예약" 등 개인 정보 → query_my_data (로그인 필요)
- user_id가 없는데 query_my_data를 써야 하면 → 로그인 안내
- 빌딩명 검색은 반드시 LIKE '%영문명%' 사용
- ⚠️ DB 빌딩명은 영문으로 저장됨. 한글 입력 시 반드시 영문으로 변환:
  유니플레이스A/유니플A → 'Uniplace A', 유니플레이스B → 'Uniplace B', 유니플레이스C → 'Uniplace C'
  예: "유니플레이스A 방 개수" → WHERE b.building_nm LIKE '%Uniplace A%'
- 인사말, 사용법 질문 → 도구 없이 직접 답변

[DB 스키마]
{DB_SCHEMA}

[답변 원칙]
- 사용자가 사용한 언어로 답변하세요. 한국어 → 한국어, 영어 → 영어, 일본어 → 일본어, 중국어 → 중국어.
- 금액 단위는 사용자 언어에 맞게 표기하세요. (한국어: "50만원", 영어/일본어/중국어: "500,000 KRW")
- 도구 결과를 기반으로 구체적으로 답변하세요.
- 이전 대화 맥락을 유지하세요."""


def run_tool_orchestrator(req: AiRequest) -> AiResponse:
    """모든 챗봇 요청의 단일 진입점."""
    prompt = (req.prompt or "").strip()
    if not prompt:
        return AiResponse(answer="무엇을 도와드릴까요?", confidence=1.0)

    user_id  = req.user_id
    provider = (settings.llm_provider or "groq").lower()
    try:
        return _run(prompt, req.get_history(), user_id, provider)
    except Exception as e:
        logger.error("[ToolOrchestrator] 처리 실패: %s", e, exc_info=True)
        return AiResponse(
            answer="죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            confidence=0.0,
        )


def _run(prompt: str, history: list[dict], user_id: str | None, provider: str) -> AiResponse:
    client = _get_client(provider)
    if client is None:
        return AiResponse(answer="AI 서비스 설정이 필요합니다.", confidence=0.0)

    primary_model = settings.groq_model if provider == "groq" else settings.openai_model
    messages      = _build_messages(prompt, history, user_id)
    tools         = _to_openai_tools(TOOL_DEFINITIONS)

    # ── Step 1: tool 선택 (429 시 fallback 자동 전환) ──────────────────────────
    resp1, used_model = _call_with_fallback(
        client, provider, primary_model,
        dict(temperature=0.0, max_tokens=600, messages=messages,
             tools=tools, tool_choice="auto"),
    )
    if resp1 is None:
        return AiResponse(answer="AI 서비스에 일시적인 문제가 있습니다.", confidence=0.0)

    choice = resp1.choices[0]
    raw_content = (choice.message.content or "").strip()

    # ★ 일부 모델이 tool_calls 대신 텍스트에 <function=...> 또는 <function>...</function> 를 섞어 반환하는 경우 감지
    if "<function=" in raw_content or "<function_calls>" in raw_content or "<function>" in raw_content:
        logger.warning("[ToolOrchestrator] 모델 %s 가 tool call을 텍스트로 반환 — "
                       "tool calling 미지원 모델. 답변 재생성 시도.", used_model)
        # tool call 텍스트 제거 후 일반 답변으로 재요청
        clean_messages = _build_messages(prompt, history, user_id)
        clean_messages[-1]["content"] += "\n(도구를 사용하지 말고 알고 있는 내용으로 간단히 답변하세요)"
        resp_clean, _ = _call_with_fallback(
            client, provider, used_model,
            dict(temperature=0.3, max_tokens=512, messages=clean_messages),
        )
        answer = (resp_clean.choices[0].message.content or "").strip() if resp_clean else \
                 "죄송합니다, 잠시 후 다시 시도해주세요."
        answer = _clean_function_call_text(answer)
        return AiResponse(answer=answer, confidence=0.60)

    # LLM이 tool 없이 직접 답변
    if choice.finish_reason == "stop":
        logger.info("[ToolOrchestrator] 직접 답변 model=%s", used_model)
        return AiResponse(answer=raw_content, confidence=0.90)

    tool_calls = choice.message.tool_calls or []
    if not tool_calls:
        return AiResponse(answer=raw_content, confidence=0.80)

    # ── Step 2: tool 실행 ──────────────────────────────────────────────────────
    all_context: list[str] = []
    tool_result_msgs       = []

    for tc in tool_calls:
        tool_name = tc.function.name
        try:
            tool_args = json.loads(tc.function.arguments or "{}")
        except json.JSONDecodeError:
            tool_args = {}

        logger.info("[ToolOrchestrator] Step2 tool=%s desc=%s",
                    tool_name, tool_args.get("description", tool_args.get("sql", ""))[:100])

        if tool_name in AUTH_REQUIRED_TOOLS and not user_id:
            result = {"success": False, "error": "AUTH_REQUIRED"}
        else:
            if tool_name == "query_my_data" and user_id:
                sql = tool_args.get("sql", "")
                tool_args["sql"] = sql.replace("{user_id}", user_id)
            result = execute_tool(tool_name, tool_args, user_id)

        # ★ Step2 결과 상세 로그 — 실패 원인 파악용
        if not result.get("success"):
            logger.error("[ToolOrchestrator] Step2 FAILED tool=%s error=%s",
                         tool_name, result.get("error"))
        else:
            logger.info("[ToolOrchestrator] Step2 OK tool=%s rows=%d",
                        tool_name, len(result.get("data") or []))

        context_docs = format_tool_result(tool_name, result)
        all_context.extend(context_docs)
        tool_result_msgs.append({
            "tool_call_id": tc.id,
            "role":         "tool",
            "content":      "\n".join(context_docs),
        })

    # ── Step 3: 최종 답변 생성 (같은 모델 사용, 429 시 다시 fallback) ─────────
    logger.info("[ToolOrchestrator] Step3 context_lines=%d model=%s", len(all_context), used_model)

    final_messages = messages + [
        {
            "role":    "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id":   tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in tool_calls
            ],
        },
        *tool_result_msgs,
    ]

    resp3, used_model3 = _call_with_fallback(
        client, provider, used_model,   # Step1에서 성공한 모델부터 시작
        dict(temperature=0.4, max_tokens=1024, messages=final_messages),
    )

    if resp3 is None:
        answer = "조회 결과: " + " / ".join(all_context[:3])
    else:
        answer = (resp3.choices[0].message.content or "").strip()

    # ★ 최종 답변에 function call 텍스트가 섞인 경우 후처리
    answer = _clean_function_call_text(answer)
    if not answer:
        answer = "조회 결과: " + " / ".join(all_context[:3]) if all_context else "죄송합니다, 답변을 생성하지 못했습니다."

    return AiResponse(
        answer=answer,
        confidence=0.93,
        metadata={"tools": [tc.function.name for tc in tool_calls], "model": used_model3},
    )


# ── Rate Limit Fallback ────────────────────────────────────────────────────────

def _call_with_fallback(client, provider: str, start_model: str, kwargs: dict):
    """
    LLM 호출. 429(Rate Limit) 발생 시 fallback 모델로 순서대로 재시도.
    Returns: (completion_response | None, used_model_name)
    """
    # 시도할 모델 목록: 시작 모델 + (groq면 fallback 목록)
    if provider == "groq":
        candidates = _build_groq_candidates(start_model)
    else:
        candidates = [start_model]

    last_error = None
    for model in candidates:
        try:
            logger.info("[ToolOrchestrator] LLM 호출 model=%s", model)
            resp = client.chat.completions.create(model=model, **kwargs)
            if model != start_model:
                logger.warning("[ToolOrchestrator] fallback 성공: %s → %s", start_model, model)
            return resp, model

        except RateLimitError as e:
            logger.warning("[ToolOrchestrator] 429 model=%s → 다음 모델 시도", model)
            last_error = e
            continue

        except Exception as e:
            err_str = str(e)
            # 모델 지원 종료(400) 또는 rate limit 계열이면 다음 모델 시도
            if "decommissioned" in err_str or "model_not_found" in err_str or "400" in err_str:
                logger.warning("[ToolOrchestrator] 모델 사용 불가 model=%s → 다음 모델 시도", model)
                last_error = e
                continue
            logger.warning("[ToolOrchestrator] 오류 model=%s: %s", model, e)
            last_error = e
            break

    logger.error("[ToolOrchestrator] 모든 모델 실패: %s", last_error)
    return None, start_model


def _build_groq_candidates(primary: str) -> list[str]:
    """primary 모델 + GROQ_FALLBACK_MODELS 중 중복 제거한 순서 목록."""
    seen = set()
    result = []
    for m in [primary] + GROQ_FALLBACK_MODELS:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return result


# ── 헬퍼 ──────────────────────────────────────────────────────────────────────

def _get_client(provider: str):
    if provider == "groq":
        if not settings.groq_api_key:
            return None
        return OpenAI(api_key=settings.groq_api_key,
                      base_url=settings.groq_base_url, timeout=25.0)
    if provider == "openai":
        if not settings.openai_api_key:
            return None
        return OpenAI(api_key=settings.openai_api_key, timeout=30.0)
    return None


def _build_messages(prompt: str, history: list[dict], user_id: str | None) -> list[dict]:
    system = _SYSTEM_PROMPT
    if user_id:
        system += f"\n\n[현재 로그인 사용자 ID: {user_id}]"
    else:
        system += "\n\n[현재 비로그인 상태 — query_my_data 사용 불가]"

    messages = [{"role": "system", "content": system}]
    for msg in (history or [])[-8:]:
        role    = msg.get("role", "")
        content = (msg.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": prompt})
    return messages


def _to_openai_tools(tool_defs: list[dict]) -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name":        t["name"],
                "description": t["description"],
                "parameters":  t["parameters"],
            },
        }
        for t in tool_defs
    ]


import re as _re

def _clean_function_call_text(text: str) -> str:
    """
    LLM이 tool call을 텍스트로 섞어 반환한 경우 해당 부분을 제거.
    예: <function>query_database</function>{...}</function>
        <function=query_database>{...}</function>
        <function_calls>...</function_calls>
    """
    if not text:
        return text

    # <function_calls>...</function_calls> 블록 전체 제거
    text = _re.sub(r"<function_calls>.*?</function_calls>", "", text, flags=_re.DOTALL)

    # <function>이름</function>{...}</function> 형식 제거
    text = _re.sub(r"<function>[^<]*</function>\s*\{.*?\}</function>", "", text, flags=_re.DOTALL)

    # <function=이름>{...}</function> 형식 제거
    text = _re.sub(r"<function=[^>]*>\s*\{.*?\}\s*</function>", "", text, flags=_re.DOTALL)

    # 남은 <function...> 태그 제거
    text = _re.sub(r"</?function[^>]*>", "", text)

    return text.strip()