import logging
from typing import Any

from app.config.settings import settings
from app.schemas.ai_request import AiRequest
from sentence_transformers import SentenceTransformer

_embedding_model = SentenceTransformer("BAAI/bge-m3")

logger = logging.getLogger(__name__)


def search_vectors(req: AiRequest) -> list[str]:
    query = _build_query(req)
    if not query:
        return []

    if not settings.milvus_uri or not settings.milvus_collection:
        return []

    vector = _embed_query(query)
    if not vector:
        return []

    try:
        from pymilvus import MilvusClient  # type: ignore

        client = MilvusClient(
            uri=settings.milvus_uri,
            token=settings.milvus_token or None,
            db_name=settings.milvus_db_name or "default",
        )
        results = client.search(
            collection_name=settings.milvus_collection,
            data=[vector],
            limit=max(1, settings.top_k),
            output_fields=["text", "content", "chunk", "title", "source"],
            search_params={"metric_type": "COSINE", "params": {"nprobe": 10}},
        )
    except Exception as exc:
        logger.warning("Milvus search failed: %s", exc.__class__.__name__)
        return []

    return _extract_texts(results, threshold=settings.similarity_threshold)


def embed_text(text: str) -> list[float]:
    normalized = (text or "").strip()
    if not normalized:
        return []
    return _embed_query(normalized)


def _build_query(req: AiRequest) -> str:
    prompt = (req.prompt or "").strip()
    topic = str(req.get_slot("topic") or "").strip()
    keyword = str(req.get_slot("keyword") or "").strip()
    return " ".join(part for part in (prompt, topic, keyword) if part).strip()


def _embed_query(text: str) -> list[float]:
    vec = _embedding_model.encode(text)
    return vec.tolist()


def _embed_with_openai(text: str) -> list[float]:
    if not settings.openai_api_key:
        return []
    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=settings.openai_api_key, timeout=20.0)
        resp = client.embeddings.create(model=settings.openai_embedding_model, input=text)
        if resp.data and resp.data[0].embedding:
            return list(resp.data[0].embedding)
    except Exception as exc:
        logger.warning("OpenAI embedding failed: %s", exc.__class__.__name__)
    return []


def _embed_with_watsonx(text: str) -> list[float]:
    if not settings.watsonx_api_key or not settings.watsonx_project_id or not settings.watsonx_embedding_model_id:
        return []
    try:
        from ibm_watsonx_ai.credentials import Credentials  # type: ignore
        from ibm_watsonx_ai.foundation_models.embeddings import Embeddings  # type: ignore

        credentials = Credentials(url=settings.watsonx_url, api_key=settings.watsonx_api_key)
        model = Embeddings(
            model_id=settings.watsonx_embedding_model_id,
            credentials=credentials,
            project_id=settings.watsonx_project_id,
        )
        vector = model.embed_query(text)
        return list(vector) if isinstance(vector, list) else []
    except Exception as exc:
        logger.warning("watsonx embedding failed: %s", exc.__class__.__name__)
        return []


def _extract_texts(results: Any, threshold: float) -> list[str]:
    if not isinstance(results, list) or not results:
        return []

    first = results[0] if isinstance(results[0], list) else results
    if not isinstance(first, list):
        return []

    docs: list[str] = []
    for hit in first:
        if not isinstance(hit, dict):
            continue

        score = _to_float(hit.get("score"))
        if score is not None and score < threshold:
            continue

        text = _pick_text(hit)
        if text and text not in docs:
            docs.append(text)
    return docs


def _pick_text(hit: dict[str, Any]) -> str:
    entity = hit.get("entity")
    if isinstance(entity, dict):
        for key in ("text", "content", "chunk", "title", "source"):
            value = entity.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    for key in ("text", "content", "chunk", "title", "source"):
        value = hit.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _to_float(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None