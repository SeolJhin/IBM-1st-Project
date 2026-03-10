from pydantic import BaseModel, Field
from typing import Any, Dict, Optional


class AiResponse(BaseModel):
    answer: str = ""
    confidence: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AiErrorDetail(BaseModel):
    code: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class AiErrorResponse(BaseModel):
    error: AiErrorDetail
