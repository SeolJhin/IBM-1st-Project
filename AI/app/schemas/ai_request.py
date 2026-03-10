from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
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

    # ── 편의 메서드: 자주 쓰는 슬롯 ──────────────────────────

    def get_history(self) -> List[Dict[str, str]]:
        """멀티턴 대화 기록. slots.history 또는 slots.conversationHistory"""
        return (
            self.get_slot("history")
            or self.get_slot("conversationHistory")
            or []
        )

    def get_language(self) -> str:
        """언어 코드. 기본값 ko"""
        return self.get_slot("language") or "ko"

    def get_transcribed_text(self) -> Optional[str]:
        """STT 변환 텍스트 (voice-assistant 전용)"""
        return self.get_slot("transcribedText") or self.get_slot("transcribed_text")

    def get_query(self) -> Optional[str]:
        """RAG 검색 쿼리"""
        return self.get_slot("query") or self.prompt

    def get_collection(self) -> str:
        """Milvus 컬렉션명. 기본값 uniplace_docs"""
        return self.get_slot("collection") or "uniplace_docs"

    def get_top_k(self) -> int:
        """RAG 검색 결과 수. 기본값 5"""
        return int(self.get_slot("topK") or self.get_slot("top_k") or 5)

    def get_content(self) -> Optional[str]:
        """모더레이션 대상 텍스트"""
        return self.get_slot("content") or self.prompt

    def get_content_type(self) -> str:
        """콘텐츠 타입 (board/reply). 기본값 board"""
        return self.get_slot("contentType") or self.get_slot("content_type") or "board"
