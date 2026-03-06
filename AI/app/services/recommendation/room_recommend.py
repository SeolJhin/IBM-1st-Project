from app.schemas.ai_request import AiRequest


def recommend_rooms(req: AiRequest) -> str:
    return "Found 5 matched rooms. Do you want to book a tour now?"
