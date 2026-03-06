from app.schemas.ai_request import AiRequest


def recommend_common_space(req: AiRequest) -> str:
    return "Recommended available common space slots based on usage pattern."
