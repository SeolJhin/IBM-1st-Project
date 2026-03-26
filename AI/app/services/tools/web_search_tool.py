# app/services/tools/web_search_tool.py
"""
DuckDuckGo 웹 검색 Tool.

완전 무료, API 키 불필요.
pip install duckduckgo-search
"""
import logging
import re
from typing import Any

from app.config.settings import settings

logger = logging.getLogger(__name__)

# ── Tool Definition (LLM에게 전달) ───────────────────────────────────────────

WEB_SEARCH_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "web_search",
        "description": (
            "인터넷에서 최신 정보를 검색합니다. "
            "UNI PLACE DB에 없는 외부 정보(날씨, 부동산 시세, 지역 정보, 법령, 뉴스 등)가 필요할 때 사용하세요. "
            "날씨 질문에는 반드시 이 도구를 사용하세요. "
            "UNI PLACE 내부 데이터(계약·결제·방 정보 등)는 query_database를 사용하세요."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": (
                        "검색할 키워드 또는 질문. 한국어/영어 모두 가능. "
                        "날씨 검색 시 '서울 오늘 날씨', '노량진 날씨' 형태로 입력."
                    ),
                },
                "topic": {
                    "type": "string",
                    "enum": ["general", "news", "weather"],
                    "description": (
                        "general: 일반 검색 (기본값) / "
                        "news: 최신 뉴스 / "
                        "weather: 날씨 검색 (지역명 날씨 질문 시 반드시 선택)"
                    ),
                },
            },
            "required": ["query"],
        },
    },
}


# ── 날씨 전용 검색 ────────────────────────────────────────────────────────────

def _fetch_weather(location: str) -> dict[str, Any]:
    """
    wttr.in API로 날씨 조회 (무료, 인증 불필요).
    한글 지역명도 지원.
    """
    import urllib.request
    import json as _json

    # 한글 지역명 → URL 인코딩
    from urllib.parse import quote
    encoded = quote(location)
    url = f"https://wttr.in/{encoded}?format=j1&lang=ko"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "curl/7.68.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = _json.loads(resp.read().decode("utf-8"))

        current = data["current_condition"][0]
        area = data.get("nearest_area", [{}])[0]
        area_nm = area.get("areaName", [{}])[0].get("value", location)
        country = area.get("country", [{}])[0].get("value", "")

        temp_c    = current.get("temp_C", "?")
        feels_c   = current.get("FeelsLikeC", "?")
        humidity  = current.get("humidity", "?")
        desc_list = current.get("weatherDesc", [{}])
        desc      = desc_list[0].get("value", "") if desc_list else ""
        wind_kmph = current.get("windspeedKmph", "?")
        precip_mm = current.get("precipMM", "0")
        visibility= current.get("visibility", "?")

        # 3일 예보
        forecast_lines = []
        for day in data.get("weather", [])[:3]:
            date     = day.get("date", "")
            max_c    = day.get("maxtempC", "?")
            min_c    = day.get("mintempC", "?")
            hourly   = day.get("hourly", [])
            day_desc = ""
            if hourly:
                mid = hourly[len(hourly)//2]
                desc_h = mid.get("weatherDesc", [{}])[0].get("value", "")
                day_desc = f" ({desc_h})" if desc_h else ""
            forecast_lines.append(f"{date}: 최고 {max_c}°C / 최저 {min_c}°C{day_desc}")

        summary = (
            f"📍 {area_nm}{', ' + country if country else ''} 현재 날씨\n"
            f"🌡️ 기온: {temp_c}°C (체감 {feels_c}°C)\n"
            f"☁️ 날씨: {desc}\n"
            f"💧 습도: {humidity}%\n"
            f"💨 풍속: {wind_kmph} km/h\n"
            f"🌧️ 강수량: {precip_mm} mm\n"
            f"👁️ 가시거리: {visibility} km\n"
        )
        if forecast_lines:
            summary += "\n📅 3일 예보:\n" + "\n".join(forecast_lines)

        return {
            "results": [{"title": f"{area_nm} 날씨", "url": f"https://wttr.in/{encoded}", "content": summary}],
            "answer": summary,
            "error": None,
        }

    except Exception as e:
        logger.warning("[WebSearch] wttr.in 날씨 실패 location=%s error=%s", location, e)
        # fallback: DuckDuckGo 텍스트 검색
        return None


def _extract_location_from_query(query: str) -> str:
    """날씨 검색 쿼리에서 지역명 추출."""
    query = re.sub(r"(오늘|내일|이번주|날씨|기온|온도|비|눈|맑음|흐림|weather|forecast)", "", query).strip()
    query = re.sub(r"\s+", " ", query).strip()
    return query or "서울"


# ── 실행 함수 ─────────────────────────────────────────────────────────────────

def execute_web_search(query: str, topic: str = "general") -> dict[str, Any]:
    """
    DuckDuckGo + wttr.in 혼합 검색.
    - topic=weather 또는 쿼리에 '날씨' 포함 → wttr.in 날씨 API 우선 시도
    - 그 외 → DuckDuckGo 텍스트/뉴스 검색
    """
    # ── 날씨 감지 ────────────────────────────────────────────────────────────
    is_weather = (
        topic == "weather"
        or "날씨" in query
        or "기온" in query
        or "weather" in query.lower()
        or "forecast" in query.lower()
    )

    if is_weather:
        location = _extract_location_from_query(query)
        logger.info("[WebSearch] 날씨 검색 location=%s", location)
        weather_result = _fetch_weather(location)
        if weather_result:
            return weather_result
        # wttr.in 실패 시 DuckDuckGo fallback (아래로 계속)
        query = f"{location} 오늘 날씨"
        topic = "general"

    # ── DuckDuckGo 검색 ──────────────────────────────────────────────────────
    try:
        from duckduckgo_search import DDGS

        max_results = getattr(settings, "tavily_max_results", 5)

        # 검색어 정제 — "부동산"만 있으면 포탈만 나오므로 구체화
        if "부동산" in query and len(query) > 5:
            query = query.replace("부동산 계약서", "임대차 계약서")
            query = query.replace("부동산계약서", "임대차계약서")

        with DDGS() as ddgs:
            if topic == "news":
                raw = list(ddgs.news(query, max_results=max_results))
                results = [
                    {
                        "title":   r.get("title", ""),
                        "url":     r.get("href") or r.get("url", ""),
                        "content": r.get("body", "")[:500],
                    }
                    for r in raw
                ]
            else:
                raw = list(ddgs.text(query, max_results=max_results))
                results = [
                    {
                        "title":   r.get("title", ""),
                        "url":     r.get("href") or r.get("url", ""),
                        "content": r.get("body", "")[:500],
                    }
                    for r in raw
                ]

        logger.info("[WebSearch] DuckDuckGo query=%s results=%d", query, len(results))
        return {
            "results": results,
            "answer":  None,
            "error":   None,
        }

    except ImportError:
        return {
            "results": [],
            "answer":  None,
            "error":   "duckduckgo-search 미설치. pip install duckduckgo-search",
        }
    except Exception as e:
        logger.error("[WebSearch] 오류: %s", e, exc_info=True)
        return {
            "results": [],
            "answer":  None,
            "error":   str(e),
        }


def format_web_search_result(result: dict) -> str:
    """LLM에게 전달할 검색 결과 텍스트로 변환."""
    if result.get("error"):
        return f"[검색 오류] {result['error']}"

    lines = []

    if result.get("answer"):
        lines.append(f"[검색 요약]\n{result['answer']}\n")

    for i, r in enumerate(result.get("results", []), 1):
        lines.append(f"{i}. {r['title']}")
        lines.append(f"   출처: {r['url']}")
        if r.get("content"):
            lines.append(f"   내용: {r['content']}")
        lines.append("")

    return "\n".join(lines) if lines else "검색 결과가 없습니다."