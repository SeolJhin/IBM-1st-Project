from app.schemas.ai_request import AiRequest


def generate_answer(req: AiRequest, docs: list[str]) -> str:
    if req.prompt:
        return f"Guidance for question: {req.prompt}"
    return "Guidance generated."
