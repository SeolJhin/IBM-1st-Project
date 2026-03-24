"""
LLM 응답 텍스트 방어 유틸리티 (tool_orchestrator / admin_tool_orchestrator 공통)

LLM이 tool call을 텍스트로 노출하거나, raw JSON 데이터를 답변으로 출력하는 경우를
감지·제거하는 함수들을 모아 둡니다.
"""

import json
import re

# ── 감지 대상 패턴 (LLM이 텍스트로 tool call을 노출하는 경우) ─────────────────

# Step1에서 raw_content에 tool 텍스트가 섞여 있는지 검사할 때 사용
BAD_TOOL_KEYWORDS: list[str] = [
    "<function=",
    "<function_calls>",
    "<function>",
    "<tool_code>",
    "<tool_call>",
    "<invoke>",
    "<|python_tag|>",
    '"tool_code"',
    "print(default_api.",
    "tool call",
    "tool_call",
]


def has_bad_tool_patterns(text: str) -> bool:
    """텍스트에 tool call 노출 패턴이 포함되어 있는지 검사."""
    if not text:
        return False
    lower = text.lower()
    for kw in BAD_TOOL_KEYWORDS:
        if kw.startswith("<") or kw.startswith('"') or kw.startswith("print("):
            # 대소문자 구분 없이 검사해야 하는 패턴
            if kw.lower() in lower:
                return True
        else:
            if kw in text:
                return True
    return False


def clean_function_call_text(text: str) -> str:
    """LLM이 tool call / JSON / 코드를 텍스트로 섞어 반환한 경우 해당 부분을 제거."""
    if not text:
        return ""

    # [UNI PLACE AI] / [AI] / [챗봇] 등 접두어 제거
    text = re.sub(r"^\s*\[(?:UNI PLACE AI|UNI PLACE|AI|챗봇|어시스턴트)\]\s*", "", text)

    # <think>...</think> reasoning 블록 제거 (DeepSeek, QwQ 등 reasoning 모델)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)

    # "버튼:" / "버튼 :" / "Button:" 등 __BUTTONS__ 앞의 레이블 텍스트 제거
    text = re.sub(r'(?i)(버튼\s*:|button\s*:|링크\s*:)\s*', '', text)

    # ── XML/태그 형태 tool call 제거 ────────────────────────────────────────
    text = re.sub(r"<function_calls>.*?</function_calls>", "", text, flags=re.DOTALL)
    text = re.sub(r"<tool_code>.*?</tool_code>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<tool_code>.*", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<tool_call>.*?</tool_call>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<tool_call>.*", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<invoke>.*?</invoke>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<invoke>.*", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<\|python_tag\|>.*", "", text, flags=re.DOTALL)

    # <function>이름</function>{...}</function> 형식 제거
    text = re.sub(r"<function>[^<]*</function>\s*\{.*?\}</function>", "", text, flags=re.DOTALL)
    # <function=이름>{...}</function> 형식 제거
    text = re.sub(r"<function=[^>]*>\s*\{.*?\}\s*</function>", "", text, flags=re.DOTALL)
    # 남은 <function...> 태그 제거
    text = re.sub(r"</?function[^>]*>", "", text)

    # ── JSON 형태 tool call 제거 ────────────────────────────────────────────
    # [{"response": "..."}] 형태의 단순 응답 JSON → 텍스트 추출
    resp_match = re.search(r'\[\s*\{\s*"response"\s*:\s*"([^"]*)"\s*\}\s*\]', text)
    if resp_match:
        text = resp_match.group(1)

    # JSON 배열 형태 tool call 텍스트 제거
    text = re.sub(r"```(?:json)?\s*\[\s*\{\s*\"name\".*?\]\s*```", "", text, flags=re.DOTALL)
    text = re.sub(
        r"^\s*\[\s*\{\s*\"name\"\s*:\s*\"(?:query_database|query_my_data|"
        r"get_tour_available_slots|classify_complain_priority|rag_search|"
        r"query_database_admin|admin_stats|web_search)\".*?\]\s*$",
        "", text, flags=re.DOTALL | re.MULTILINE,
    )

    # Gemini가 단일 JSON 객체로 tool call을 반환하는 패턴
    text = re.sub(
        r"```(?:json)?\s*\{\s*\"(?:sql|name|query|description|tool)\"\s*:.*?\}\s*```",
        "", text, flags=re.DOTALL,
    )

    # 순수 JSON 객체 전체가 답변인 경우 (앞뒤에 다른 텍스트 없음)
    stripped = text.strip()
    if stripped.startswith("{") and stripped.endswith("}"):
        try:
            parsed = json.loads(stripped)
            _tool_keys = {
                "sql", "name", "parameters", "arguments", "tool_code",
                "query", "description", "function", "tool",
            }
            if isinstance(parsed, dict) and _tool_keys & set(parsed.keys()):
                text = ""
        except Exception:
            pass

    # Gemini/일부 모델이 출력하는 tool_code 패턴 제거
    text = re.sub(r"```(?:json|python)?\s*\{[^`]*\"tool_code\"\s*:[^`]*\}\s*```", "", text, flags=re.DOTALL)
    text = re.sub(r"\{[^{}]*\"tool_code\"\s*:\s*\"[^\"]*\"\s*\}", "", text, flags=re.DOTALL)

    # print(default_api.xxx(...)) 패턴 단독 제거
    text = re.sub(r"print\s*\(\s*default_api\.[^)]+\)\s*\)", "", text, flags=re.DOTALL)
    text = re.sub(r"print\s*\(\s*default_api\..*", "", text, flags=re.DOTALL)

    # 마크다운 코드블록 내 순수 SQL 제거 (답변이 SQL만인 경우)
    if re.match(r"^\s*```(?:sql)?\s*SELECT\b.*```\s*$", text, flags=re.DOTALL | re.IGNORECASE):
        text = ""

    # ── 버튼 JSON 배열이 raw 텍스트로 노출된 경우 __BUTTONS__ 형식으로 변환 ──
    # 예: [{"label":"예약","url":"/book"}] → __BUTTONS__[{"label":"예약","url":"/book"}]
    # __BUTTONS__ 마커 없이 노출된 버튼 JSON만 변환 (이미 마커 있으면 스킵)
    if "__BUTTONS__" not in text:
        def _convert_raw_button_json(m: re.Match) -> str:
            try:
                parsed = json.loads(m.group(0))
                if (isinstance(parsed, list) and parsed
                        and isinstance(parsed[0], dict)
                        and "label" in parsed[0] and "url" in parsed[0]):
                    return f"__BUTTONS__{m.group(0)}"
            except Exception:
                pass
            return m.group(0)
        text = re.sub(
            r'\[\s*\{[^]]*"label"[^]]*"url"[^]]*\}\s*\]',
            _convert_raw_button_json, text,
        )

    return text.strip()


def is_tool_call_json(text: str) -> bool:
    """답변이 tool call JSON 또는 raw 데이터 JSON인지 감지 (버튼 JSON은 제외)."""
    stripped = (text or "").strip()

    # 배열 형태 [{"name": ...}] 또는 raw 데이터 배열 [{"building_nm": ...}]
    if stripped.startswith("[") and stripped.endswith("]"):
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
                first = parsed[0]
                # 버튼 JSON은 제외
                if "label" in first and "url" in first:
                    return False
                return True
        except Exception:
            pass

    # 단일 객체 형태 {"sql": ..., "description": ...} 또는 {"name": ...}
    if stripped.startswith("{") and stripped.endswith("}"):
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, dict):
                _tool_keys = {
                    "sql", "name", "parameters", "arguments",
                    "tool_code", "query", "description", "function",
                }
                _text_keys = {"answer", "message", "content", "text", "response"}
                if (_tool_keys & set(parsed.keys())) and not (_text_keys & set(parsed.keys())):
                    return True
        except Exception:
            pass

    return False


def is_structured_tool_text(text: str) -> bool:
    """텍스트가 tool call / function call / 구조화 JSON인지 종합 판단."""
    s = (text or "").strip()
    if not s:
        return False
    return is_tool_call_json(s) or has_bad_tool_patterns(s)
