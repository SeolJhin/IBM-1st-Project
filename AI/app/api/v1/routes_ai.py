from typing import Any, Dict

from fastapi import APIRouter, Body, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiErrorDetail, AiErrorResponse, AiResponse
from app.services.orchestrator.workflow_graph import WorkflowGraph

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])
workflow = WorkflowGraph()


@router.post(
    "/execute",
    response_model=AiResponse,
    responses={
        400: {"model": AiErrorResponse, "description": "Bad request"},
        422: {"model": AiErrorResponse, "description": "Validation error"},
        500: {"model": AiErrorResponse, "description": "Internal server error"},
    },
)
def execute(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    try:
        req = AiRequest.model_validate(payload)
    except ValidationError as exc:
        return _error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="AI_VALIDATION_ERROR",
            message="Invalid AI request payload.",
            details={"errors": exc.errors()},
        )

    try:
        response = workflow.run(req)
        if response.answer == "Unsupported intent.":
            return _error_response(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="AI_UNSUPPORTED_INTENT",
                message="Unsupported AI intent.",
                details={"intent": req.intent},
            )
        return response
    except Exception as exc:
        return _error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="AI_INTERNAL_ERROR",
            message="AI service failed to process the request.",
            details={"type": exc.__class__.__name__},
        )


def _error_response(status_code: int, code: str, message: str, details: Dict[str, Any]) -> JSONResponse:
    body = AiErrorResponse(error=AiErrorDetail(code=code, message=message, details=details))
    return JSONResponse(status_code=status_code, content=body.model_dump())
