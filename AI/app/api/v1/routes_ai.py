from fastapi import APIRouter
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.orchestrator.workflow_graph import WorkflowGraph

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])
workflow = WorkflowGraph()


@router.post("/execute", response_model=AiResponse)
def execute(req: AiRequest) -> AiResponse:
    return workflow.run(req)
