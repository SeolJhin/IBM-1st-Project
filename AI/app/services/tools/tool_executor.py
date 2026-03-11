# app/services/tools/tool_executor.py
"""
Spring Boot /api/v1/ai/tools/execute 에 tool 실행 요청을 보내는 클라이언트.
"""
import logging
from typing import Any

import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)


def execute_tool(tool_name: str, tool_args: dict, user_id: str | None = None) -> dict[str, Any]:
    """
    Spring에 tool 실행 요청을 보내고 결과를 반환합니다.

    Returns:
        {"success": True, "data": [...], "meta": {...}}
        {"success": False, "error": "AUTH_REQUIRED" | "오류 메시지"}
    """
    payload = {
        "tool":    tool_name,
        "args":    tool_args,
        "user_id": user_id,
    }

    base_url = settings.spring_base_url
    url = f"{base_url}/api/v1/ai/tools/execute"

    try:
        import json as _json
        # ensure_ascii=False: 한글이 \uXXXX escape 없이 UTF-8 그대로 전송
        payload_bytes = _json.dumps(payload, ensure_ascii=False).encode("utf-8")

        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                url,
                content=payload_bytes,
                headers={"Content-Type": "application/json; charset=utf-8"},
            )

            if resp.status_code == 401:
                return {"success": False, "error": "AUTH_REQUIRED"}

            resp.raise_for_status()
            result = resp.json()
            rows = result.get("data") or []
            logger.info("[ToolExecutor] %s → success=%s rows=%d",
                        tool_name, result.get("success"), len(rows))
            if not result.get("success"):
                logger.error("[ToolExecutor] Spring 응답 실패: %s", result)
            return result

    except httpx.TimeoutException:
        logger.warning("[ToolExecutor] timeout: tool=%s", tool_name)
        return {"success": False, "error": "도구 실행 시간 초과"}

    except httpx.HTTPStatusError as e:
        logger.warning("[ToolExecutor] HTTP %d: tool=%s body=%s",
                       e.response.status_code, tool_name, e.response.text[:200])
        return {"success": False, "error": f"서버 오류 ({e.response.status_code})"}

    except Exception as e:
        logger.warning("[ToolExecutor] error: tool=%s %s", tool_name, e)
        return {"success": False, "error": str(e)}