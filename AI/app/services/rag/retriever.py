from app.schemas.ai_request import AiRequest


def retrieve_context(req: AiRequest) -> list[str]:
    keyword = req.slots.get("keyword") or req.prompt or ""
    return [f"context:{keyword}"]
