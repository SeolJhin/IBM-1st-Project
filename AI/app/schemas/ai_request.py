# app/schemas/ai_request.py
"""
AiRequest — Spring에서 오는 camelCase 필드를 자동으로 snake_case로 매핑.

Spring AiGatewayRequest JSON:
  {"intent": "AI_AGENT_CHATBOT", "userId": "user123", "userSegment": "...", "prompt": "...", "slots": {...}}

기존 AiRequest는 user_id, user_segment (snake_case)만 받아서 userId가 항상 None으로 처리됨.
→ model_config에 populate_by_name=True + alias 추가로 해결.
"""
import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator
from pydantic import ConfigDict


class AiRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,   # snake_case 필드명으로도 받을 수 있게
        extra="ignore",           # 알 수 없는 필드 무시
    )

    intent: str = Field(..., description="AI intent")

    # Spring은 camelCase로 보내므로 alias 지정 + snake_case도 허용
    user_id: Optional[str] = Field(None, alias="userId")
    user_segment: Optional[str] = Field(None, alias="userSegment")

    prompt: Optional[str] = None
    slots: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        """
        Spring이 camelCase로 보내는 필드를 snake_case로 정규화.
        Pydantic alias로 처리되지 않는 경우를 위한 fallback.
        """
        if not isinstance(data, dict):
            return data

        # userId → user_id (alias로 처리되지만 명시적으로도 처리)
        if "userId" in data and "user_id" not in data:
            data["user_id"] = data["userId"]
        if "userSegment" in data and "user_segment" not in data:
            data["user_segment"] = data["userSegment"]

        # slots 안의 userId도 user_id로 정규화 (일부 경로에서 slots에 담겨 오는 경우)
        slots = data.get("slots") or {}
        if isinstance(slots, dict):
            if "userId" in slots and not data.get("user_id") and not data.get("userId"):
                data["user_id"] = slots["userId"]
            if "userSegment" in slots and not data.get("user_segment") and not data.get("userSegment"):
                data["user_segment"] = slots["userSegment"]

        return data

    # ── 편의 메서드 ──────────────────────────────────────────────────────────

    def get_slot(self, key: str, default: Any = None) -> Any:
        for candidate in self._slot_candidates(key):
            if candidate in self.slots:
                return self.slots[candidate]
        return default

    @staticmethod
    def _slot_candidates(key: str) -> list[str]:
        snake = AiRequest._to_snake_case(key)
        camel = AiRequest._to_camel_case(snake)
        candidates: list[str] = []
        for item in (key, snake, camel):
            if item and item not in candidates:
                candidates.append(item)
        return candidates

    @staticmethod
    def _to_snake_case(value: str) -> str:
        s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", value)
        return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()

    @staticmethod
    def _to_camel_case(value: str) -> str:
        parts = value.split("_")
        if not parts:
            return value
        return parts[0] + "".join(p.capitalize() for p in parts[1:])

    def get_history(self) -> List[Dict[str, str]]:
        return self.get_slot("history") or self.get_slot("conversationHistory") or []

    def get_language(self) -> str:
        return self.get_slot("language") or "ko"

    def get_transcribed_text(self) -> Optional[str]:
        return self.get_slot("transcribedText") or self.get_slot("transcribed_text")

    def get_query(self) -> Optional[str]:
        return self.get_slot("query") or self.prompt

    def get_collection(self) -> str:
        return self.get_slot("collection") or "uniplace_docs"

    def get_top_k(self) -> int:
        return int(self.get_slot("topK") or self.get_slot("top_k") or 5)

    def get_content(self) -> Optional[str]:
        return self.get_slot("content") or self.prompt

    def get_content_type(self) -> str:
        return self.get_slot("contentType") or self.get_slot("content_type") or "board"
