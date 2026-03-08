import logging

from openai import OpenAI

from app.config.settings import settings
from app.schemas.ai_request import AiRequest

logger = logging.getLogger(__name__)


def chat_with_openai(req: AiRequest, docs: list[str]) -> str:
    if not settings.openai_api_key:
        return ""

    question = (req.prompt or "").strip()
    if not question:
        return ""

    context_block = "\n".join(f"- {doc}" for doc in docs[:5]) if docs else "- (no retrieved context)"
    system_prompt = (
        "You are a Korean real-estate residence assistant for Uniplace. "
        "Answer concisely in Korean. Use only the given context when possible."
    )
    user_prompt = (
        f"intent: {req.intent}\n"
        f"context:\n{context_block}\n"
        f"question:\n{question}\n"
        "Provide a practical answer for end users."
    )

    try:
        client = OpenAI(api_key=settings.openai_api_key, timeout=20.0)
        response = client.chat.completions.create(
            model=settings.openai_model or settings.default_model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content if response.choices else None
        if isinstance(content, str):
            return content.strip()
        return ""
    except Exception as exc:
        logger.warning("OpenAI call failed: %s", exc.__class__.__name__)
        return ""
