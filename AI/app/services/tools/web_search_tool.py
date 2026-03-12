# app/services/tools/web_search_tool.py
"""
DuckDuckGo 웹 검색 Tool.

완전 무료, API 키 불필요.
pip install duckduckgo-search
"""
import logging
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
            "UNI PLACE DB에 없는 외부 정보(부동산 시세, 지역 정보, 법령, 뉴스 등)가 필요할 때 사용하세요. "
            "UNI PLACE 내부 데이터(계약·결제·방 정보 등)는 query_database를 사용하세요."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "검색할 키워드 또는 질문. 한국어/영어 모두 가능.",
                },
                "topic": {
                    "type": "string",
                    "enum": ["general", "news"],
                    "description": "general: 일반 검색 (기본값) / news: 최신 뉴스",
                },
            },
            "required": ["query"],
        },
    },
}


# ── 실행 함수 ─────────────────────────────────────────────────────────────────

def execute_web_search(query: str, topic: str = "general") -> dict[str, Any]:
    """
    DuckDuckGo로 웹 검색 실행. API 키 불필요, 완전 무료.
    """
    try:
        from duckduckgo_search import DDGS

        max_results = getattr(settings, "tavily_max_results", 5)

        with DDGS() as ddgs:
            if topic == "news":
                raw = list(ddgs.news(query, max_results=max_results))
                results = [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "content": r.get("body", "")[:500],
                    }
                    for r in raw
                ]
            else:
                raw = list(ddgs.text(query, max_results=max_results))
                results = [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "content": r.get("body", "")[:500],
                    }
                    for r in raw
                ]

        logger.info("[WebSearch] DuckDuckGo query=%s results=%d", query, len(results))
        return {
            "results": results,
            "answer": None,
            "error": None,
        }

    except ImportError:
        return {
            "results": [],
            "answer": None,
            "error": "duckduckgo-search 미설치. pip install duckduckgo-search",
        }
    except Exception as e:
        logger.error("[WebSearch] 오류: %s", e, exc_info=True)
        return {
            "results": [],
            "answer": None,
            "error": str(e),
        }


def format_web_search_result(result: dict) -> str:
    """LLM에게 전달할 검색 결과 텍스트로 변환."""
    if result.get("error"):
        return f"[검색 오류] {result['error']}"

    lines = []

    if result.get("answer"):
        lines.append(f"[검색 요약] {result['answer']}\n")

    for i, r in enumerate(result.get("results", []), 1):
        lines.append(f"{i}. {r['title']}")
        lines.append(f"   출처: {r['url']}")
        if r.get("content"):
            lines.append(f"   내용: {r['content']}")
        lines.append("")

    return "\n".join(lines) if lines else "검색 결과가 없습니다."