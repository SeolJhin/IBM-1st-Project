from pydantic import BaseModel, Field
from typing import Any, Dict, Optional


class AiResponse(BaseModel):
    answer: str = ""
    confidence: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
