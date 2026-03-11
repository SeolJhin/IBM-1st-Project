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

# 페이지 라우트 맵 — AI가 링크 버튼을 생성할 때 참고
PAGE_ROUTES = {
    "건물목록":        ("/buildings",                    "🏢"),
    "방목록":          ("/rooms",                        "🚪"),
    "투어예약":        ("/reservations/tour/create",     "📅"),
    "투어예약목록":    ("/reservations/tour/list",       "📋"),
    "커뮤니티리뷰":    ("/community?tab=REVIEW",         "⭐"),
    "리뷰목록":       ("/community?tab=REVIEW",         "⭐"),
    "공용공간예약":    ("/me?tab=space&sub=create",      "🏋️"),
    "공용공간예약목록":("/me?tab=space&sub=list",        "📋"),
    "계약신청":        ("/contracts/apply",              "📝"),
    "공지사항":        ("/support/notice",               "📢"),
    "FAQ":             ("/support/faq",                  "❓"),
    "문의하기":        ("/support/qna/write",            "💬"),
    "민원접수":        ("/support/complain/write",       "📣"),
    "민원목록":        ("/support/complain",             "📋"),
    "내리뷰":          ("/reviews/my",                   "⭐"),
}


logger = logging.getLogger(__name__)

# Groq 429/400 시 순서대로 fallback 시도 (2026-03 기준 활성 모델)
# mixtral-8x7b-32768: decommissioned / gemma2-9b-it: tool calling 불안정 → 제거
GROQ_FALLBACK_MODELS = [
    # Preview 모델 (tool calling 지원)
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    # Production 모델 (안정적)
    "openai/gpt-oss-20b",                             # GPT-OSS 20B (production)
    "llama-3.1-8b-instant",                           # Llama 3.1 8B (production, 경량)
    # 제외: llama-3.3-70b-specdec, llama3-70b-8192, gemma2-9b-it, llama3-groq-70b-8192-tool-use-preview (decommissioned)
    # 제외: qwen/qwen3-32b (TPM 6000 한도 초과)
    # 제외: mixtral-8x7b-32768 (decommissioned 2025-03)
    # 제외: gemma2-9b-it (tool calling 불안정)
    # 제외: llama-3.1-8b-instant (tool call을 텍스트로 섞어 반환)
]

_SYSTEM_PROMPT_TEMPLATE = """당신은 UNI PLACE 주거 플랫폼의 AI 어시스턴트입니다.
오늘 날짜: {today}. 날짜 관련 답변 시 반드시 오늘 날짜 기준으로 작성하세요.

[사용 가능한 도구]
1. query_database   — 공개 데이터 조회 (로그인 불필요)
2. query_my_data    — 개인 데이터 조회 (로그인 필요, SQL에 WHERE user_id = '{{user_id}}' 필수)
3. get_tour_available_slots — 투어 예약 가능 시간대 조회 (새 예약 시에만 사용)
   ⚠️ "투어 예약 조회", "내 투어 예약 확인" → 이 도구 사용 금지. query_my_data 사용할 것
4. classify_complain_priority — 민원 우선순위 분류

[도구 선택]
- 방/빌딩/리뷰 등 공개 데이터 → query_database
- "내 계약/예약/민원" 등 개인 정보 → query_my_data (user_id 없으면 로그인 안내)
- "투어 예약 조회", "내 투어 예약" → 버튼만 제공 (도구 호출 불필요)
  버튼: __BUTTONS__[{{"label":"투어 예약 조회","url":"/reservations/tour/list","icon":"📋"}}]
  ⚠️ room_reservation 테이블에 user_id 없음 → SQL 조회 시도 금지, 버튼만 안내
- "투어 예약하고 싶다", "투어 신청" → get_tour_available_slots 호출 후 버튼 제공
  버튼: __BUTTONS__[{{"label":"투어 예약","url":"/reservations/tour/create","icon":"📅"}}]
- 인사말, 사용법 질문 → 도구 없이 직접 답변

[SQL 규칙]
- 방 조회 시 반드시 buildings JOIN해서 building_nm 포함:
  SELECT r.room_no, r.floor, r.deposit, r.monthly_rent, r.maintenance_fee, r.room_options, b.building_nm
  FROM rooms r JOIN buildings b ON r.building_id = b.building_id
  WHERE r.delete_yn = 'N' AND b.delete_yn = 'N'
- 빌딩명은 영문 저장: 유니플레이스A→'Uniplace A', B→'Uniplace B', C→'Uniplace C'
- 방 옵션(room_options)은 한글/영문 혼재 가능. 반드시 아래처럼 완전한 컬럼명으로 OR 검색:
  에어컨: (r.room_options LIKE '%에어컨%' OR r.room_options LIKE '%aircon%')
  냉장고: (r.room_options LIKE '%냉장고%' OR r.room_options LIKE '%refrigerator%' OR r.room_options LIKE '%fridge%')
  세탁기: (r.room_options LIKE '%세탁기%' OR r.room_options LIKE '%washer%')
  침대:   (r.room_options LIKE '%침대%' OR r.room_options LIKE '%bed%')
  책상:   (r.room_options LIKE '%책상%' OR r.room_options LIKE '%desk%')
  옷장:   (r.room_options LIKE '%옷장%' OR r.room_options LIKE '%wardrobe%')
  전자레인지: (r.room_options LIKE '%전자레인지%' OR r.room_options LIKE '%microwave%')
  ⚠️ 절대 r.(LIKE ...) 형태 사용 금지. 반드시 r.room_options LIKE '%값%' 형태로 작성

[대화 맥락 유지]
- 이전 대화 흐름을 유지하고 현재 메시지를 맥락과 연결해서 해석하세요.
- 방 번호만 말하고 건물명이 없으면 건물명 먼저 질문하세요.

[리뷰 작성 요청]
1. user_id 없음 → 로그인 안내
2. user_id 있음 → query_my_data로 계약 조회:
   SELECT c.room_id, r.room_no, b.building_nm FROM contract c
   JOIN rooms r ON c.room_id=r.room_id JOIN building b ON r.building_id=b.building_id
   WHERE c.user_id='{{user_id}}' AND c.contract_st IN ('active','approved','ended')
   AND r.delete_yn='N' AND b.delete_yn='N'
3. 계약 없음 → "계약 내역이 없어 리뷰를 작성할 수 없습니다."
4. 계약 있음 → /rooms/실제room_id 로 안내 (⚠️ /reviews/write 절대 사용 금지)
   버튼: __BUTTONS__[{{"label":"방 상세 보기","url":"/rooms/{{{{room_id}}}}","icon":"🏠"}}]

[페이지 안내]
- 리뷰 전체 보기 (커뮤니티): /community?tab=REVIEW
- 내 리뷰 보기 (마이페이지 작성목록): /me?tab=posts&sub=community&postTab=reviews
  ⚠️ "내 리뷰", "내가 쓴 리뷰", "내 후기" → 반드시 /me?tab=posts&sub=community&postTab=reviews
  ⚠️ "리뷰 보고싶다", "후기 보고싶다" (소유자 없음) → /community?tab=REVIEW
- 방 목록: /rooms  건물 목록: /buildings  방 상세: /rooms/{{roomId}}
- 투어 예약: /reservations/tour/create  투어 목록: /reservations/tour/list
- 공용공간 예약: /me?tab=space&sub=create
- 계약 신청: /contracts/apply?roomId={{roomId}}
- 공지사항: /support/notice  FAQ: /support/faq
- 1:1문의: /support/qna/write  민원: /support/complain/write

[답변 원칙]
- 사용자 언어로 답변 (한국어→한국어, 영어→영어)
- 금액: 한국어는 "50만원", 그 외는 "500,000 KRW"
- 답변 끝에 이동할 페이지가 있으면 버튼 추가:
  __BUTTONS__[{{"label":"버튼명","url":"/경로","icon":"이모지"}}]

[DB 스키마]
{DB_SCHEMA}"""


def _extract_buttons(answer: str) -> tuple[str, list[dict]]:
    """
    AI 답변에서 버튼 정보를 파싱해 (정제된 답변, 버튼목록) 반환.
    지원 형식:
      1. __BUTTONS__[{"label":...,"url":...}]  ← 정상 형식
      2. <button label="..." url="..." icon="..."></button>  ← 태그 형식
      3. [{"label":...,"url":...}]  ← 순수 JSON 배열 (답변 전체가 버튼인 경우)
    """
    import re, json as _json

    buttons = []
    clean_answer = answer

    # 형식 1: __BUTTONS__[...]
    pattern1 = r'__BUTTONS__\s*(\[.*?\])'
    match = re.search(pattern1, answer, re.DOTALL)
    if match:
        raw_buttons = match.group(1)
        clean_answer = answer[:match.start()].strip()
        try:
            parsed = _json.loads(raw_buttons)
            if isinstance(parsed, list):
                buttons = [b for b in parsed if isinstance(b, dict) and b.get("url")]
        except Exception:
            pass
        return clean_answer, buttons

    # 형식 2: <button label="..." url="..." icon="...">...</button>
    pattern2 = r'<button\s+label=["\']([^"\']*)["\']\s+url=["\']([^"\']*)["\'](?:\s+icon=["\']([^"\']*)["\'])?\s*(?:/?>|>.*?</button>)'
    btn_matches = re.findall(pattern2, answer, re.DOTALL | re.IGNORECASE)
    if btn_matches:
        for label, url, icon in btn_matches:
            buttons.append({"label": label, "url": url, "icon": icon or "🔗"})
        clean_answer = re.sub(pattern2, '', answer, flags=re.DOTALL | re.IGNORECASE).strip()
        return clean_answer, buttons

    # 형식 3: 답변 전체 또는 끝부분이 JSON 배열 [{"label":...,"url":...}]
    stripped = answer.strip()
    # 끝에 붙은 JSON 배열 감지
    json_arr_pattern = r'(\[\s*\{\s*"label".*?\]\s*)$'
    arr_match = re.search(json_arr_pattern, stripped, re.DOTALL)
    if arr_match:
        try:
            parsed = _json.loads(arr_match.group(1))
            if isinstance(parsed, list):
                for b in parsed:
                    if isinstance(b, dict) and b.get("url"):
                        buttons.append(b)
                clean_answer = stripped[:arr_match.start()].strip()
        except Exception:
            pass
        if buttons:
            return clean_answer, buttons

    return answer.strip(), []


def run_tool_orchestrator(req: AiRequest) -> AiResponse:
    """모든 챗봇 요청의 단일 진입점."""
    prompt = (req.prompt or "").strip()
    if not prompt:
        return AiResponse(answer="무엇을 도와드릴까요?", confidence=1.0)

    # user_id 다중 경로 fallback: req.user_id → slots.userId → slots.slots.userId
    user_id = req.user_id
    if not user_id:
        slots = req.slots or {}
        user_id = (slots.get("userId")
                   or slots.get("user_id")
                   or (slots.get("slots") or {}).get("userId")
                   or (slots.get("slots") or {}).get("user_id"))
    provider = (settings.llm_provider or "groq").lower()
    logger.info("[ToolOrchestrator] request user_id=%s slots_userId=%s",
                user_id, (req.slots or {}).get("userId", "MISSING"))
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
    _today_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
        today=__import__("datetime").date.today().strftime("%Y-%m-%d"),
        DB_SCHEMA=DB_SCHEMA
    )
    messages      = _build_messages(prompt, history, user_id, _today_prompt)
    tools         = _to_openai_tools(TOOL_DEFINITIONS)

    # ── Step 1: tool 선택 (429 시 fallback 자동 전환) ──────────────────────────
    resp1, used_model = _call_with_fallback(
        client, provider, primary_model,
        dict(temperature=0.0, max_tokens=1024, messages=messages,
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
        clean_messages = _build_messages(prompt, history, user_id, _today_prompt)
        clean_messages[-1]["content"] += "\n(도구를 사용하지 말고 알고 있는 내용으로 간단히 답변하세요)"
        resp_clean, _ = _call_with_fallback(
            client, provider, used_model,
            dict(temperature=0.3, max_tokens=2048, messages=clean_messages),
        )
        answer = (resp_clean.choices[0].message.content or "").strip() if resp_clean else \
                 "죄송합니다, 잠시 후 다시 시도해주세요."
        answer = _clean_function_call_text(answer)
        return AiResponse(answer=answer, confidence=0.60)

    # LLM이 tool 없이 직접 답변
    if choice.finish_reason == "stop":
        logger.info("[ToolOrchestrator] 직접 답변 model=%s", used_model)
        clean_answer, buttons = _extract_buttons(raw_content)
        if not clean_answer and buttons:
            clean_answer = "아래 버튼을 이용해 주세요."
        elif not clean_answer:
            clean_answer = raw_content  # 파싱 실패 시 원문 반환
        direct_meta = {"action_buttons": buttons} if buttons else {}
        return AiResponse(answer=clean_answer, confidence=0.90, metadata=direct_meta)

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
            # room_options 옵션 키워드 양방향 정규화 (한글↔영문 모두 검색)
            if "sql" in tool_args:
                tool_args["sql"] = _normalize_options_in_sql(tool_args["sql"])
            result = execute_tool(tool_name, tool_args, user_id)

        # ★ Step2 결과 상세 로그 — 실패 원인 파악용
        if not result.get("success"):
            logger.error("[ToolOrchestrator] Step2 FAILED tool=%s error=%s",
                         tool_name, result.get("error"))
            # DB 오류 시 LLM이 재시도 JSON을 출력하지 않도록 명시적 실패 메시지 주입
            result = {
                "success": False,
                "data": [],
                "error": "데이터베이스 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
                "_db_error": True,
            }
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
        dict(temperature=0.4, max_tokens=4096, messages=final_messages),
    )

    if resp3 is None:
        answer = "조회 결과: " + " / ".join(all_context[:3])
    else:
        answer = (resp3.choices[0].message.content or "").strip()

    # ★ 최종 답변에 function call 텍스트가 섞인 경우 후처리
    answer = _clean_function_call_text(answer)

    # ★ 답변이 tool call JSON 배열 그 자체인 경우 → 재생성 요청
    if not answer or _is_tool_call_json(answer):
        logger.warning("[ToolOrchestrator] Step3 답변이 tool call JSON — 일반 답변 재생성")
        fallback_messages = _build_messages(prompt, history, user_id, _today_prompt)
        # tool 결과를 컨텍스트로 직접 주입해서 일반 답변 요청
        context_text = "\n".join(all_context[:10]) if all_context else "조회 결과 없음"
        fallback_messages[-1]["content"] = (
            f"{prompt}\n\n[참고 데이터]\n{context_text}\n\n"
            "위 데이터를 바탕으로 사용자에게 자연스러운 한국어로 답변하세요. "
            "JSON이나 코드 블록 없이 순수 텍스트로만 답변하세요."
        )
        resp_fb, _ = _call_with_fallback(
            client, provider, used_model3,
            dict(temperature=0.4, max_tokens=4096, messages=fallback_messages),
        )
        if resp_fb:
            answer = (resp_fb.choices[0].message.content or "").strip()
            answer = _clean_function_call_text(answer)

    if not answer:
        answer = "조회 결과: " + " / ".join(all_context[:3]) if all_context else "죄송합니다, 답변을 생성하지 못했습니다."

    clean_answer, buttons = _extract_buttons(answer)
    # 버튼만 있고 텍스트 없는 경우 기본 안내 문구 생성
    if not clean_answer and buttons:
        clean_answer = "아래 버튼을 이용해 주세요."
    elif not clean_answer:
        clean_answer = "죄송합니다, 답변을 생성하지 못했습니다."
    resp_metadata = {"tools": [tc.function.name for tc in tool_calls], "model": used_model3}
    if buttons:
        resp_metadata["action_buttons"] = buttons
    return AiResponse(
        answer=clean_answer,
        confidence=0.93,
        metadata=resp_metadata,
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


# 직전 사용자 메시지에서 진행 중인 의도를 감지하는 키워드 맵
_ONGOING_INTENT_KEYWORDS = {
    "tour": ["투어 예약", "투어하고 싶", "투어 보고 싶", "방 투어", "tour reservation", "투어 신청"],
    "complain": ["민원 접수", "민원 신청", "불편 신고"],
    "space_reservation": ["공용 공간 예약", "공용시설 예약", "헬스장 예약", "회의실 예약"],
}

_ONGOING_INTENT_HINT = {
    "tour": (
        "⚠️ 사용자는 현재 [투어 예약] 진행 중입니다. "
        "현재 메시지는 투어할 방 정보(빌딩명/호수)를 알려주는 것입니다. "
        "반드시 get_tour_available_slots 도구를 호출해 예약 가능한 시간대를 안내하세요. "
        "query_database로 방 정보를 조회하지 마세요."
    ),
    "complain": (
        "⚠️ 사용자는 현재 [민원 접수] 진행 중입니다. "
        "현재 메시지는 민원 내용입니다. classify_complain_priority 도구를 호출하세요."
    ),
    "space_reservation": (
        "⚠️ 사용자는 현재 [공용 공간 예약] 진행 중입니다. "
        "현재 메시지는 예약할 공간/시간 정보입니다. query_database로 공간 정보를 조회하세요."
    ),
}


def _detect_ongoing_intent(history: list[dict]) -> str | None:
    """직전 2턴 내 사용자 발화에서 진행 중인 의도 감지."""
    recent_user_msgs = [
        m.get("content", "") for m in (history or [])[-4:]
        if m.get("role") == "user"
    ]
    for intent_key, keywords in _ONGOING_INTENT_KEYWORDS.items():
        for msg in recent_user_msgs:
            if any(kw in msg for kw in keywords):
                return intent_key
    return None



# ── 옵션 키워드 양방향 정규화 ──────────────────────────────────────────────────
# DB에 한글로 저장되어 있으면 한글 패턴 → 영문 패턴도 같이 OR 검색
# DB에 영문으로 저장되어 있으면 영문 패턴 → 한글 패턴도 같이 OR 검색
# → 어느 쪽으로 저장되어 있어도 한글/영문 모두 검색되도록 SQL을 확장

_OPTION_ALIASES: list[tuple[list[str], str, str]] = [
    # (검색 키워드 목록,  한글 DB값,  영문 DB값)
    (["에어컨", "aircon", "air conditioner", "에어콘"],    "에어컨",      "aircon"),
    (["냉장고", "refrigerator", "fridge"],                 "냉장고",      "refrigerator"),
    (["세탁기", "washer", "washing machine"],              "세탁기",      "washer"),
    (["침대", "bed"],                                      "침대",        "bed"),
    (["책상", "desk"],                                     "책상",        "desk"),
    (["옷장", "wardrobe", "closet"],                       "옷장",        "wardrobe"),
    (["전자레인지", "microwave"],                           "전자레인지",   "microwave"),
    (["TV", "텔레비전", "television"],                     "TV",          "TV"),
    (["인덕션", "induction"],                              "인덕션",      "induction"),
    (["전기레인지", "electric range", "electric_range"],    "전기레인지",  "electric_range"),
    (["샤워기", "shower"],                                 "샤워기",      "shower"),
    (["욕조", "bathtub"],                                  "욕조",        "bathtub"),
]

def _normalize_options_in_sql(sql: str) -> str:
    """
    SQL 안의 room_options LIKE '%키워드%' 를
    room_options LIKE '%한글%' OR room_options LIKE '%영문%' 형태로 확장.
    이미 OR로 확장된 경우는 건드리지 않음.
    """
    import re as _re2
    if not sql or "room_options" not in sql.lower():
        return sql

    # LIKE '%키워드%' 패턴 치환 (작은따옴표 한정 - SQL 표준)
    pattern = _re2.compile(
        r"(room_options)\s+LIKE\s+'%([^%']+)%'",
        _re2.IGNORECASE
    )
    def _wrap(m2):
        col2 = m2.group(1)
        kw2  = m2.group(2).lower().strip()
        for keywords, kor, eng in _OPTION_ALIASES:
            if kw2 in [k.lower() for k in keywords]:
                if kor.lower() == eng.lower():
                    return m2.group(0)
                return f"({col2} LIKE '%{kor}%' OR {col2} LIKE '%{eng}%')"
        return m2.group(0)
    return pattern.sub(_wrap, sql)

def _build_messages(prompt: str, history: list[dict], user_id: str | None, system_prompt: str | None = None) -> list[dict]:
    system = system_prompt or _SYSTEM_PROMPT_TEMPLATE.format(today=__import__("datetime").date.today().strftime("%Y-%m-%d"), DB_SCHEMA=DB_SCHEMA)
    if user_id:
        system += f"\n\n[현재 로그인 사용자 ID: {user_id}]"
    else:
        system += "\n\n[현재 비로그인 상태 — query_my_data 사용 불가]"

    # 진행 중인 의도 감지 → 시스템 프롬프트에 힌트 주입
    ongoing = _detect_ongoing_intent(history)
    if ongoing and ongoing in _ONGOING_INTENT_HINT:
        system += f"\n\n{_ONGOING_INTENT_HINT[ongoing]}"

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
    """
    if not text:
        return text

    # <think>...</think> reasoning 블록 제거 (DeepSeek, QwQ 등 reasoning 모델)
    text = _re.sub(r"<think>.*?</think>", "", text, flags=_re.DOTALL)

    # <function_calls>...</function_calls> 블록 전체 제거
    text = _re.sub(r"<function_calls>.*?</function_calls>", "", text, flags=_re.DOTALL)

    # <function>이름</function>{...}</function> 형식 제거
    text = _re.sub(r"<function>[^<]*</function>\s*\{.*?\}</function>", "", text, flags=_re.DOTALL)

    # <function=이름>{...}</function> 형식 제거
    text = _re.sub(r"<function=[^>]*>\s*\{.*?\}\s*</function>", "", text, flags=_re.DOTALL)

    # 남은 <function...> 태그 제거
    text = _re.sub(r"</?function[^>]*>", "", text)

    # [{"response": "..."}] 형태의 단순 응답 JSON 제거 후 텍스트 추출
    resp_match = _re.search(r'\[\s*\{\s*"response"\s*:\s*"([^"]*)"\s*\}\s*\]', text)
    if resp_match:
        text = resp_match.group(1)

    # JSON 배열 형태 tool call 텍스트 제거
    # 예: [{"name": "query_database", "parameters": {...}}]
    # 또는 ```json\n[...]\n```
    text = _re.sub(r"```(?:json)?\s*\[\s*\{\s*\"name\".*?\]\s*```", "", text, flags=_re.DOTALL)
    text = _re.sub(r"^\s*\[\s*\{\s*\"name\"\s*:\s*\"(?:query_database|query_my_data|get_tour_available_slots|classify_complain_priority)\".*?\]\s*$", "", text, flags=_re.DOTALL | _re.MULTILINE)

    return text.strip()


def _is_tool_call_json(text: str) -> bool:
    """답변이 tool call JSON 배열인지 감지 (버튼 JSON은 제외)."""
    stripped = text.strip()
    if not (stripped.startswith("[") and stripped.endswith("]")):
        return False
    try:
        import json as _j
        parsed = _j.loads(stripped)
        if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
            first = parsed[0]
            # 버튼 JSON은 "label"+"url" 키를 가짐 → tool call 아님
            if "label" in first and "url" in first:
                return False
            # tool call JSON은 "name"+"parameters"/"arguments" 키를 가짐
            return "name" in first and ("parameters" in first or "arguments" in first)
    except Exception:
        pass
    return False