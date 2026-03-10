from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
import re


class AiRequest(BaseModel):
    intent: str = Field(..., description="AI intent")
    user_id: Optional[str] = None
    user_segment: Optional[str] = None
    prompt: Optional[str] = None
    slots: Dict[str, Any] = Field(default_factory=dict)

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
        return parts[0] + "".join(part.capitalize() for part in parts[1:])
