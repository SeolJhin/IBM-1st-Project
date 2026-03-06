from app.schemas.ai_request import AiRequest


def recommend_contract_rooms(req: AiRequest) -> str:
    return "Contract is near end date. Recommend top 3 similar rooms?"
