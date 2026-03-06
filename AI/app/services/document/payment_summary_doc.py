from app.schemas.ai_request import AiRequest


def make_payment_summary(req: AiRequest) -> str:
    return "Monthly payment summary is ready. Document can be generated."
