import logging
from typing import Any

from app.config.settings import settings
from app.schemas.ai_request import AiRequest

_embedding_model = None

logger = logging.getLogger(__name__)


def search_vectors(req: AiRequest) -> list[str]:
    # ── 문제1 수정: query와 prompt 둘 다 사용 ──────────────────────────────
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

        # ── 문제3 수정: 검색 전 컬렉션 실제 존재 여부 확인 ──────────────────
        if not client.has_collection(collection_name=settings.milvus_collection):
            logger.warning("Milvus collection '%s' not found — RAG unavailable",
                           settings.milvus_collection)
            return []

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
    # ── 문제1 수정: prompt와 query(slots) 모두 활용 ────────────────────────
    prompt = (req.prompt or "").strip()
    query = str(req.get_slot("query") or "").strip()   # ← query 슬롯 추가
    topic = str(req.get_slot("topic") or "").strip()
    keyword = str(req.get_slot("keyword") or "").strip()
    # prompt 또는 query 중 있는 것 사용 (중복 제거)
    text = query if query and not prompt else prompt
    return " ".join(part for part in (text, topic, keyword) if part).strip()


def _embed_query(text: str) -> list[float]:
    # ── 문제2 수정: embedding_provider 분기 적용 ──────────────────────────
    provider = (settings.embedding_provider or "bge").strip().lower()

    if provider == "openai":
        return _embed_with_openai(text)
    if provider in ("watsonx", "ibm"):
        return _embed_with_watsonx(text)
    # 기본값: bge (로컬 SentenceTransformer)
    return _embed_with_bge(text)


def _embed_with_bge(text: str) -> list[float]:
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            _embedding_model = SentenceTransformer("BAAI/bge-m3")
            logger.info("BGE 임베딩 모델 로딩 완료")
        except Exception as exc:
            logger.warning("SentenceTransformer load failed: %s", exc.__class__.__name__)
            return []

    vec = _embedding_model.encode(text)
    return vec.tolist() if hasattr(vec, "tolist") else list(vec)


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

        score = _to_float(hit.get("distance") or hit.get("score"))
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