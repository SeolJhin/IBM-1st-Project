import logging

from app.config.settings import settings
from app.schemas.ai_request import AiRequest

logger = logging.getLogger(__name__)


def chat_with_watsonx(req: AiRequest, docs: list[str]) -> str:
    if not settings.watsonx_api_key or not settings.watsonx_project_id:
        return ""

    question = (req.prompt or "").strip()
    if not question:
        return ""

    context_block = "\n".join(f"- {doc}" for doc in docs[:5]) if docs else "- (no retrieved context)"
    prompt = (
        "You are a Korean real-estate residence assistant for Uniplace.\n"
        "Answer briefly and clearly in Korean.\n"
        f"intent: {req.intent}\n"
        f"context:\n{context_block}\n"
        f"question:\n{question}\n"
        "answer:"
    )

    try:
        from ibm_watsonx_ai.credentials import Credentials  # type: ignore
        from ibm_watsonx_ai.foundation_models import ModelInference  # type: ignore

        credentials = Credentials(url=settings.watsonx_url, api_key=settings.watsonx_api_key)
        model = ModelInference(
            model_id=settings.watsonx_model_id,
            credentials=credentials,
            project_id=settings.watsonx_project_id,
        )
        result = model.generate(
            prompt=prompt,
            params={"decoding_method": "greedy", "max_new_tokens": 256, "min_new_tokens": 1},
        )
        return _extract_generated_text(result).strip()
    except Exception as exc:
        logger.warning("watsonx call failed: %s", exc.__class__.__name__)
        return ""


def _extract_generated_text(result: object) -> str:
    if not isinstance(result, dict):
        return ""
    results = result.get("results")
    if isinstance(results, list) and results:
        first = results[0]
        if isinstance(first, dict):
            text = first.get("generated_text")
            if isinstance(text, str):
                return text
    text = result.get("generated_text")
    return text if isinstance(text, str) else ""
