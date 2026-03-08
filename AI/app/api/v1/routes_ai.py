from typing import Any, Dict

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from app.api.v1.executor import ERROR_RESPONSES, execute_ai_request, parse_ai_request
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post(
    "/execute",
    response_model=AiResponse,
    responses=ERROR_RESPONSES,
)
def execute(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse):
        return parsed
    req: AiRequest = parsed
    return execute_ai_request(req)
