from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.orchestrator.intent_router import IntentRouter


class WorkflowGraph:
    def __init__(self) -> None:
        self.router = IntentRouter()

    def run(self, req: AiRequest) -> AiResponse:
        return self.router.route(req)
