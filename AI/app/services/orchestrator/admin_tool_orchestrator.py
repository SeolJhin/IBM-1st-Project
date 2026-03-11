# app/services/orchestrator/admin_tool_orchestrator.py
"""
어드민 전용 AI Tool Calling Orchestrator.

[일반 챗봇과의 차이]
- 모든 테이블 제한 없이 조회 가능 (user_id 필터 불필요)
- 어드민 전용 분석 도구 추가: admin_stats
- 시스템 프롬프트: 운영/관리 맥락
- Spring Security에서 ROLE_ADMIN 검증 후 호출됨 (Python 측 재검증 없음)

[보안 전제]
- 이 오케스트레이터는 Spring /ai/chat/admin-chatbot 엔드포인트에서만 호출
- 해당 엔드포인트는 @PreAuthorize("hasRole('ADMIN')") 보호
- Python 서버는 내부망 전용이므로 인터넷 직접 노출 없음
"""
import json
import logging

from openai import OpenAI, RateLimitError

from app.config.settings import settings
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.tools.db_schema import DB_SCHEMA
from app.services.tools.tool_executor import execute_tool
from app.services.tools.tool_result_formatter import format_tool_result

logger = logging.getLogger(__name__)

# ── 어드민 전용 Tool Definitions ───────────────────────────────────────────────

ADMIN_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": (
                "DB를 SQL로 조회합니다. 어드민은 모든 테이블 접근 가능. "
                "user_id 필터 없이 전체 데이터 조회 가능."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "실행할 SELECT SQL. 반드시 SELECT로 시작. LIMIT 50 포함."
                    },
                    "description": {
                        "type": "string",
                        "description": "이 쿼리가 무엇을 조회하는지 한 줄 설명"
                    }
                },
                "required": ["sql"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "admin_stats",
            "description": (
                "운영 통계를 조회합니다. "
                "period: today/week/month/all, "
                "metric: reservations/contracts/complaints/payments/occupancy"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {
                        "type": "string",
                        "enum": ["reservations", "contracts", "complaints", "payments", "occupancy"],
                        "description": "조회할 통계 지표"
                    },
                    "period": {
                        "type": "string",
                        "enum": ["today", "week", "month", "all"],
                        "description": "집계 기간"
                    },
                    "building_id": {
                        "type": "integer",
                        "description": "특정 빌딩 필터 (선택)"
                    }
                },
                "required": ["metric", "period"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "classify_complain_priority",
            "description": "민원 내용을 분석해 우선순위(high/medium/low)를 분류합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "complain_text": {
                        "type": "string",
                        "description": "민원 내용 전문"
                    }
                },
                "required": ["complain_text"]
            }
        }
    }
]

# ── 어드민 시스템 프롬프트 ─────────────────────────────────────────────────────

_ADMIN_SYSTEM_PROMPT_TEMPLATE = """당신은 UNI PLACE 운영팀 전용 AI 어시스턴트입니다.
오늘 날짜: {today}. 날짜 관련 답변 시 반드시 오늘 날짜 기준으로 작성하세요.
현재 로그인 관리자: {admin_id}

[권한]
- 모든 테이블 조회 가능 (user_id 필터 불필요)
- 입주자 계약·결제·민원·예약 전체 데이터 접근 가능
- 운영 통계 조회 가능

[사용 가능한 도구]
1. query_database  — 임의 SELECT SQL 실행 (모든 테이블, LIMIT 50)
2. admin_stats     — 운영 통계 조회 (예약수/계약수/민원수/결제/점유율)
3. classify_complain_priority — 민원 우선순위 분류

[도구 선택]
- "오늘 예약 몇 건?" → admin_stats(metric=reservations, period=today)
- "이번 달 민원 현황" → admin_stats(metric=complaints, period=month)
- "점유율 확인" → admin_stats(metric=occupancy, period=all)
- "특정 유저 계약 조회" → query_database (user_id 조건 없이도 가능)
- "민원 텍스트 분석" → classify_complain_priority
- 복잡한 집계/JOIN → query_database로 직접 SQL 작성

[SQL 규칙]
- SELECT만 허용, INSERT/UPDATE/DELETE/DROP 절대 금지
- 반드시 LIMIT 50 포함
- 빌딩명은 영문: Uniplace A / Uniplace B / Uniplace C
- building/rooms 조회 시 WHERE delete_yn='N' 포함
- 방 옵션 검색: r.room_options LIKE '%aircon%' OR r.room_options LIKE '%에어컨%'

[어드민 페이지 안내]
- 유저 목록: /admin/users
- 계약 관리: /admin/contracts
- 민원 관리: /admin/complains
- 결제 현황: /admin/billing
- 투어예약 관리: /admin/reservations/tour

[답변 원칙]
- 데이터는 표 형식(마크다운)으로 정리
- 이상 징후 발견 시 ⚠️ 표시
- 답변 끝에 관련 어드민 페이지 버튼 추가 가능:
  __BUTTONS__[{{"label":"버튼명","url":"/admin/경로","icon":"이모지"}}]

[DB 스키마]
{DB_SCHEMA}"""

# ── admin_stats → SQL 변환 매핑 ───────────────────────────────────────────────

_STATS_SQL = {
    ("reservations", "today"):
        "SELECT COUNT(*) AS count FROM room_reservation WHERE DATE(created_at) = CURDATE()",
    ("reservations", "week"):
        "SELECT COUNT(*) AS count FROM room_reservation WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
    ("reservations", "month"):
        "SELECT COUNT(*) AS count FROM room_reservation WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())",
    ("reservations", "all"):
        "SELECT tour_st, COUNT(*) AS count FROM room_reservation GROUP BY tour_st",

    ("contracts", "today"):
        "SELECT COUNT(*) AS count FROM contract WHERE DATE(created_at) = CURDATE()",
    ("contracts", "week"):
        "SELECT COUNT(*) AS count FROM contract WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
    ("contracts", "month"):
        "SELECT COUNT(*) AS count FROM contract WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())",
    ("contracts", "all"):
        "SELECT contract_st, COUNT(*) AS count FROM contract GROUP BY contract_st",

    ("complaints", "today"):
        "SELECT COUNT(*) AS count FROM complain WHERE DATE(created_at) = CURDATE()",
    ("complaints", "week"):
        "SELECT COUNT(*) AS count FROM complain WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
    ("complaints", "month"):
        "SELECT COUNT(*) AS count FROM complain WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())",
    ("complaints", "all"):
        "SELECT comp_st, importance, COUNT(*) AS count FROM complain GROUP BY comp_st, importance ORDER BY importance DESC",

    ("payments", "today"):
        "SELECT COUNT(*) AS count, SUM(captured_price) AS total FROM payment WHERE DATE(paid_at) = CURDATE()",
    ("payments", "week"):
        "SELECT COUNT(*) AS count, SUM(captured_price) AS total FROM payment WHERE paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
    ("payments", "month"):
        "SELECT COUNT(*) AS count, SUM(captured_price) AS total FROM payment WHERE YEAR(paid_at)=YEAR(NOW()) AND MONTH(paid_at)=MONTH(NOW())",
    ("payments", "all"):
        "SELECT payment_st, COUNT(*) AS count, SUM(captured_price) AS total FROM payment GROUP BY payment_st",

    ("occupancy", "all"):
        """SELECT b.building_nm,
                  COUNT(r.room_id) AS total_rooms,
                  SUM(CASE WHEN r.room_st='contracted' THEN 1 ELSE 0 END) AS contracted,
                  ROUND(SUM(CASE WHEN r.room_st='contracted' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.room_id), 1) AS occupancy_rate
           FROM rooms r JOIN building b ON r.building_id = b.building_id
           WHERE r.delete_yn='N' AND b.delete_yn='N'
           GROUP BY b.building_id, b.building_nm""",
}

# 기간 변형 없는 통계는 all로 fallback
for _m in ["reservations", "contracts", "complaints", "payments"]:
    for _p in ["today", "week", "month", "all"]:
        if (_m, _p) not in _STATS_SQL:
            _STATS_SQL[(_m, _p)] = _STATS_SQL.get((_m, "all"), f"SELECT COUNT(*) FROM {_m}")
for _p in ["today", "week", "month"]:
    _STATS_SQL[("occupancy", _p)] = _STATS_SQL[("occupancy", "all")]


def _handle_admin_stats(args: dict, admin_user_id: str, tool_call_id: str) -> dict:
    """admin_stats 도구 → SQL 실행 후 tool_result 반환."""
    import re as _re
    from app.services.tools.tool_executor import execute_tool

    metric    = args.get("metric", "reservations")
    period    = args.get("period", "all")
    building_id = args.get("building_id")

    base_sql = _STATS_SQL.get((metric, period), f"SELECT COUNT(*) AS count FROM {metric}")

    # 빌딩 필터 적용
    if building_id:
        if "WHERE" in base_sql.upper():
            base_sql = base_sql.rstrip() + f" AND building_id = {int(building_id)}"
        else:
            base_sql = base_sql.rstrip() + f" WHERE building_id = {int(building_id)}"

    # LIMIT 보장
    if "LIMIT" not in base_sql.upper():
        base_sql += " LIMIT 50"

    # query_database 도구로 실행 (어드민은 requiresAuth 체크 우회 필요 → admin=true 플래그)
    result = execute_tool(
        tool_name="query_database_admin",   # Spring에서 ADMIN 전용 분기
        args={"sql": base_sql, "description": f"{metric} 통계 ({period})"},
        user_id=admin_user_id,
    )
    return {"role": "tool", "tool_call_id": tool_call_id, "content": json.dumps(result, ensure_ascii=False)}


# ── Fallback 모델 (일반 챗봇과 공유) ─────────────────────────────────────────

_GROQ_FALLBACK = [
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
]


def _build_candidates(start_model: str) -> list[str]:
    candidates = [start_model]
    for m in _GROQ_FALLBACK:
        if m != start_model:
            candidates.append(m)
    return candidates


_GEMINI_FALLBACK = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]


def _build_gemini_candidates(start_model: str) -> list[str]:
    seen = set()
    result = []
    for m in [start_model] + _GEMINI_FALLBACK:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return result


def _call_with_fallback(client, provider: str, start_model: str, kwargs: dict):
    if provider == "groq":
        candidates = _build_candidates(start_model)
    elif provider == "gemini":
        candidates = _build_gemini_candidates(start_model)
    else:
        candidates = [start_model]
    last_err = None
    for model in candidates:
        try:
            resp = client.chat.completions.create(model=model, **kwargs)
            return resp, model
        except RateLimitError as e:
            logger.warning("[AdminOrchestrator] RateLimit model=%s: %s", model, e)
            last_err = e
        except Exception as e:
            logger.warning("[AdminOrchestrator] 호출 실패 model=%s: %s", model, e)
            last_err = e
    return None, start_model


# ── 메인 함수 ─────────────────────────────────────────────────────────────────

def run_admin_tool_orchestrator(req: AiRequest) -> AiResponse:
    """어드민 챗봇 단일 진입점."""
    import datetime as _dt

    prompt = (req.prompt or "").strip()
    if not prompt:
        return AiResponse(answer="관리자 AI에게 무엇을 질문하시겠어요?", confidence=1.0)

    admin_id = req.user_id or (req.slots or {}).get("userId") or "unknown"
    provider = (settings.llm_provider or "groq").lower()

    logger.info("[AdminOrchestrator] request admin_id=%s", admin_id)

    try:
        return _run_admin(prompt, req.get_history(), admin_id, provider)
    except Exception as e:
        logger.error("[AdminOrchestrator] 처리 실패: %s", e, exc_info=True)
        return AiResponse(
            answer="일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            confidence=0.0,
        )


def _run_admin(prompt: str, history: list[dict], admin_id: str, provider: str) -> AiResponse:
    import datetime as _dt

    system_prompt = _ADMIN_SYSTEM_PROMPT_TEMPLATE.format(
        today=_dt.date.today().strftime("%Y-%m-%d"),
        admin_id=admin_id,
        DB_SCHEMA=DB_SCHEMA,
    )

    if provider == "gemini":
        client = OpenAI(
            api_key=settings.gemini_api_key,
            base_url=settings.gemini_base_url,
        )
        primary_model = settings.gemini_model
    elif provider == "groq":
        client = OpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        primary_model = settings.groq_model
    else:
        client = OpenAI(api_key=settings.openai_api_key)
        primary_model = settings.openai_model

    # 메시지 구성
    messages = [{"role": "system", "content": system_prompt}]
    for h in (history or []):
        if h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h.get("content", "")})
    messages.append({"role": "user", "content": prompt})

    # ── Step 1: Tool 선택 ────────────────────────────────────────────────────
    resp1, used_model = _call_with_fallback(client, provider, primary_model, {
        "messages": messages,
        "tools": ADMIN_TOOL_DEFINITIONS,
        "tool_choice": "auto",
        "max_tokens": 1000,
        "temperature": 0.2,
    })

    if resp1 is None:
        return AiResponse(answer="AI 서비스 일시 불가합니다.", confidence=0.0)

    choice1 = resp1.choices[0]

    # 도구 호출 없이 직접 답변
    if not (choice1.finish_reason == "tool_calls" and choice1.message.tool_calls):
        answer = (choice1.message.content or "").strip()
        clean, buttons = _extract_buttons(answer)
        return AiResponse(answer=clean, confidence=0.9, metadata={"buttons": buttons, "model": used_model})

    tool_calls = choice1.message.tool_calls
    logger.info("[AdminOrchestrator] tools=%s model=%s",
                [tc.function.name for tc in tool_calls], used_model)

    # ── Step 2: Tool 실행 ────────────────────────────────────────────────────
    messages.append(choice1.message)
    all_context = []

    for tc in tool_calls:
        tool_name = tc.function.name
        try:
            args = json.loads(tc.function.arguments or "{}")
        except Exception:
            args = {}

        if tool_name == "admin_stats":
            tool_msg = _handle_admin_stats(args, admin_id, tc.id)
            messages.append(tool_msg)
            all_context.append(f"[{tool_name}] {tool_msg['content'][:300]}")
        else:
            # query_database, classify_complain_priority
            result = execute_tool(
                tool_name="query_database_admin" if tool_name == "query_database" else tool_name,
                args=args,
                user_id=admin_id,
            )
            formatted = format_tool_result(tool_name, result)
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(formatted, ensure_ascii=False),
            })
            all_context.append(f"[{tool_name}] {json.dumps(formatted, ensure_ascii=False)[:300]}")

        logger.info("[AdminOrchestrator] Step2 tool=%s", tool_name)

    # ── Step 3: 최종 답변 생성 ───────────────────────────────────────────────
    resp3, used_model3 = _call_with_fallback(client, provider, used_model, {
        "messages": messages,
        "max_tokens": 1500,
        "temperature": 0.3,
    })

    if resp3 is None:
        return AiResponse(
            answer="조회는 완료됐으나 응답 생성 중 오류가 발생했습니다.",
            confidence=0.5,
            metadata={"context": all_context},
        )

    answer = (resp3.choices[0].message.content or "").strip()
    clean, buttons = _extract_buttons(answer)
    return AiResponse(
        answer=clean,
        confidence=0.95,
        metadata={"buttons": buttons, "tools": [tc.function.name for tc in tool_calls], "model": used_model3},
    )


def _extract_buttons(answer: str) -> tuple[str, list[dict]]:
    """일반 챗봇과 동일한 버튼 파싱 로직."""
    import re, json as _json

    buttons = []
    clean_answer = answer

    pattern1 = r'__BUTTONS__\s*(\[.*?\])'
    match = re.search(pattern1, answer, re.DOTALL)
    if match:
        try:
            parsed = _json.loads(match.group(1))
            if isinstance(parsed, list):
                buttons = [b for b in parsed if isinstance(b, dict) and b.get("url")]
        except Exception:
            pass
        clean_answer = answer[:match.start()].strip()
        return clean_answer, buttons

    pattern2 = r'<button\s+label=["\']([^"\']*)["\']\\s+url=["\']([^"\']*)["\'](?:\s+icon=["\']([^"\']*)["\'])?\s*(?:/>|>.*?</button>)'
    btn_matches = re.findall(pattern2, answer, re.DOTALL | re.IGNORECASE)
    if btn_matches:
        for label, url, icon in btn_matches:
            buttons.append({"label": label, "url": url, "icon": icon or "🔗"})
        clean_answer = re.sub(pattern2, '', answer, flags=re.DOTALL | re.IGNORECASE).strip()
        return clean_answer, buttons

    return answer.strip(), []