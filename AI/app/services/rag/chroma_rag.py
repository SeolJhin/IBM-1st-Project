# app/services/rag/chroma_rag.py
"""
ChromaDB 기반 무료 로컬 RAG (Milvus 대체).

특징:
- 완전 무료, 로컬 파일 저장 (chroma_db/ 디렉토리)
- pip install chromadb sentence-transformers
- 임베딩: sentence-transformers (무료, 로컬 실행)
  → 인터넷 없이도 동작, OpenAI 임베딩 비용 없음
- rag_docs/ 폴더의 .txt / .md 파일을 자동 인덱싱

사용법:
  from app.services.rag.chroma_rag import chroma_rag_search, chroma_rag_index

  # 문서 인덱싱 (최초 1회 or 문서 변경 시)
  chroma_rag_index()

  # 검색
  results = chroma_rag_search("월세 납부 방법")
"""
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ── 지연 임포트 (설치 안 됐을 때 서버 전체 죽지 않게) ──────────────────────
try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    _CHROMA_AVAILABLE = True
except ImportError:
    _CHROMA_AVAILABLE = False
    logger.warning("[ChromaRAG] chromadb 미설치. pip install chromadb")

try:
    from sentence_transformers import SentenceTransformer
    _ST_AVAILABLE = True
except ImportError:
    _ST_AVAILABLE = False
    logger.warning("[ChromaRAG] sentence-transformers 미설치. pip install sentence-transformers")


# ── 싱글턴 ───────────────────────────────────────────────────────────────────
_client = None
_collection = None
_embedder = None


def _get_embedder():
    global _embedder
    if _embedder is None and _ST_AVAILABLE:
        # 한국어 지원 무료 모델 (약 500MB, 최초 실행 시 자동 다운로드)
        _embedder = SentenceTransformer("jhgan/ko-sroberta-multitask")
        logger.info("[ChromaRAG] 임베딩 모델 로드 완료")
    return _embedder


def _get_collection():
    global _client, _collection
    if not _CHROMA_AVAILABLE:
        return None
    if _collection is not None:
        return _collection

    from app.config.settings import settings

    persist_dir = settings.chroma_persist_dir
    os.makedirs(persist_dir, exist_ok=True)

    _client = chromadb.PersistentClient(
        path=persist_dir,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    _collection = _client.get_or_create_collection(
        name=settings.chroma_collection,
        metadata={"hnsw:space": "cosine"},
    )
    logger.info("[ChromaRAG] 컬렉션 로드: %s (문서 수: %d)", settings.chroma_collection, _collection.count())
    return _collection


# ── 인덱싱 ───────────────────────────────────────────────────────────────────

def chroma_rag_index(force: bool = False) -> dict[str, int]:
    """
    rag_docs/ 폴더의 .txt / .md 파일을 ChromaDB에 인덱싱.

    Args:
        force: True면 기존 컬렉션 초기화 후 재인덱싱

    Returns:
        {"indexed": n, "skipped": m, "total": t}
    """
    if not _CHROMA_AVAILABLE or not _ST_AVAILABLE:
        return {"error": "chromadb 또는 sentence-transformers 미설치", "indexed": 0, "skipped": 0, "total": 0}

    from app.config.settings import settings

    col = _get_collection()
    embedder = _get_embedder()
    if col is None or embedder is None:
        return {"error": "초기화 실패", "indexed": 0, "skipped": 0, "total": 0}

    if force:
        # 전체 초기화
        existing = col.get()
        if existing["ids"]:
            col.delete(ids=existing["ids"])
        logger.info("[ChromaRAG] 강제 재인덱싱 시작")

    source_dir = Path(settings.rag_source_dir)
    if not source_dir.exists():
        source_dir.mkdir(parents=True, exist_ok=True)
        logger.warning("[ChromaRAG] rag_docs/ 폴더 생성됨. 문서를 추가하세요.")
        return {"indexed": 0, "skipped": 0, "total": 0}

    chunk_size = settings.rag_chunk_size
    indexed = 0
    skipped = 0

    files = list(source_dir.glob("*.txt")) + list(source_dir.glob("*.md"))

    for file_path in files:
        try:
            text = file_path.read_text(encoding="utf-8")
        except Exception as e:
            logger.warning("[ChromaRAG] 파일 읽기 실패: %s — %s", file_path, e)
            skipped += 1
            continue

        # 청크 분할
        chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
        doc_name = file_path.stem

        for idx, chunk in enumerate(chunks):
            doc_id = f"{doc_name}_chunk_{idx}"

            # 이미 인덱싱된 문서 스킵 (force=False일 때)
            if not force:
                existing = col.get(ids=[doc_id])
                if existing["ids"]:
                    skipped += 1
                    continue

            embedding = embedder.encode(chunk).tolist()
            col.upsert(
                ids=[doc_id],
                embeddings=[embedding],
                documents=[chunk],
                metadatas=[{"source": file_path.name, "chunk": idx}],
            )
            indexed += 1

    logger.info("[ChromaRAG] 인덱싱 완료 indexed=%d skipped=%d", indexed, skipped)
    return {"indexed": indexed, "skipped": skipped, "total": col.count()}


# ── 검색 ─────────────────────────────────────────────────────────────────────

def chroma_rag_search(query: str, top_k: int = None) -> list[dict[str, Any]]:
    """
    ChromaDB에서 유사 문서 검색.

    Returns:
        [{"content": str, "source": str, "score": float}]
    """
    if not _CHROMA_AVAILABLE or not _ST_AVAILABLE:
        return []

    from app.config.settings import settings

    col = _get_collection()
    embedder = _get_embedder()
    if col is None or embedder is None:
        return []

    if col.count() == 0:
        logger.warning("[ChromaRAG] 인덱싱된 문서 없음. chroma_rag_index() 먼저 실행하세요.")
        return []

    k = top_k or settings.top_k
    query_embedding = embedder.encode(query).tolist()

    try:
        results = col.query(
            query_embeddings=[query_embedding],
            n_results=min(k, col.count()),
            include=["documents", "metadatas", "distances"],
        )
    except Exception as e:
        logger.error("[ChromaRAG] 검색 실패: %s", e)
        return []

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    # cosine distance → similarity score 변환
    output = []
    for doc, meta, dist in zip(docs, metas, distances):
        score = round(1.0 - dist, 4)  # distance 0 = 완전일치 → score 1.0
        if score >= settings.similarity_threshold:
            output.append({
                "content": doc,
                "source": meta.get("source", "unknown"),
                "score": score,
            })

    return output


# ── RAG Tool Definition (LLM에게 전달) ───────────────────────────────────────

RAG_SEARCH_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "rag_search",
        "description": (
            "UNI PLACE 내부 지식베이스(FAQ·규정·매뉴얼·공지사항 문서)에서 관련 내용을 검색합니다. "
            "계약 규정, 이용 약관, 서비스 안내, 주의사항 등 문서화된 정보를 찾을 때 사용하세요. "
            "실시간 DB 데이터가 필요하면 query_database를 사용하세요."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "검색할 질문 또는 키워드 (한국어 권장)",
                },
            },
            "required": ["query"],
        },
    },
}


def execute_rag_search(query: str) -> dict[str, Any]:
    """RAG 검색 실행 후 Tool 결과 형식으로 반환."""
    from app.config.settings import settings
    rag_engine = getattr(settings, "rag_engine", "chroma").lower()
    if rag_engine == "milvus":
        milvus_results = _milvus_rag_search(query)
        if milvus_results is None:
            logger.warning("[RAG] Milvus unavailable. Falling back to Chroma search")
            results = chroma_rag_search(query)
        else:
            results = milvus_results
    else:
        results = chroma_rag_search(query)

    if not results:
        return {
            "found": False,
            "message": "관련 문서를 찾지 못했습니다.",
            "results": [],
        }

    return {
        "found": True,
        "count": len(results),
        "results": [
            {
                "content": r["content"],
                "source": r["source"],
                "relevance": r["score"],
            }
            for r in results
        ],
    }


def _milvus_rag_search(query: str, top_k: int | None = None) -> list[dict[str, Any]] | None:
    from app.config.settings import settings

    normalized = (query or "").strip()
    if not normalized:
        return []
    if not settings.milvus_uri or not settings.milvus_collection:
        logger.warning("[RAG] rag_engine=milvus but Milvus is not configured")
        return None

    try:
        from pymilvus import MilvusClient  # type: ignore
        from app.integrations.milvus_client import embed_text

        vector = embed_text(normalized)
        if not vector:
            return []

        client = MilvusClient(
            uri=settings.milvus_uri,
            token=settings.milvus_token or None,
            db_name=settings.milvus_db_name or "default",
        )
        raw_results = client.search(
            collection_name=settings.milvus_collection,
            data=[vector],
            limit=max(1, top_k or settings.top_k),
            output_fields=["text", "content", "chunk", "title", "source"],
            search_params={"metric_type": "COSINE", "params": {"nprobe": 10}},
        )
    except Exception as exc:
        logger.warning("[RAG] Milvus search failed: %s", exc.__class__.__name__)
        return None

    hits = raw_results[0] if isinstance(raw_results, list) and raw_results and isinstance(raw_results[0], list) else raw_results
    if not isinstance(hits, list):
        return None

    threshold = settings.similarity_threshold
    docs: list[dict[str, Any]] = []
    seen: set[str] = set()

    for hit in hits:
        if not isinstance(hit, dict):
            continue

        score_raw = hit.get("score")
        if score_raw is None:
            score_raw = hit.get("distance")
        try:
            score = float(score_raw) if score_raw is not None else None
        except (TypeError, ValueError):
            score = None

        if score is not None and score < threshold:
            continue

        entity = hit.get("entity")
        entity = entity if isinstance(entity, dict) else {}

        content = ""
        for key in ("text", "content", "chunk"):
            value = entity.get(key)
            if isinstance(value, str) and value.strip():
                content = value.strip()
                break
        if not content:
            for key in ("text", "content", "chunk"):
                value = hit.get(key)
                if isinstance(value, str) and value.strip():
                    content = value.strip()
                    break
        if not content or content in seen:
            continue

        source = "milvus"
        for key in ("source", "title", "file", "filename"):
            value = entity.get(key)
            if isinstance(value, str) and value.strip():
                source = value.strip()
                break
        if source == "milvus":
            for key in ("source", "title", "file", "filename"):
                value = hit.get(key)
                if isinstance(value, str) and value.strip():
                    source = value.strip()
                    break

        seen.add(content)
        docs.append(
            {
                "content": content,
                "source": source,
                "score": score if score is not None else 0.0,
            }
        )

    return docs


def is_rag_available() -> bool:
    """RAG 사용 가능 여부 (패키지 설치 + 문서 인덱싱 여부)."""
    from app.config.settings import settings
    if getattr(settings, "rag_engine", "chroma").lower() == "milvus":
        return bool(settings.milvus_uri and settings.milvus_collection)
    if not _CHROMA_AVAILABLE or not _ST_AVAILABLE:
        return False
    col = _get_collection()
    return col is not None and col.count() > 0
