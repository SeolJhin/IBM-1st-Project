from pydantic import BaseModel, Field
from typing import Any, Dict, Optional


class AiRequest(BaseModel):
    intent: str = Field(..., description="AI intent")
    user_id: Optional[str] = None
    user_segment: Optional[str] = None
    prompt: Optional[str] = None
    slots: Dict[str, Any] = Field(default_factory=dict)
