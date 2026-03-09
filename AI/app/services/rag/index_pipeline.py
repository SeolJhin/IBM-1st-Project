from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from app.config.settings import settings
from app.integrations.milvus_client import embed_text

logger = logging.getLogger(__name__)


def ensure_rag_runtime() -> None:
    manifest_path = Path(settings.rag_manifest_path)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    source_dir = Path(settings.rag_source_dir)
    source_dir.mkdir(parents=True, exist_ok=True)


def get_rag_status() -> dict[str, Any]:
    ensure_rag_runtime()
    manifest = _load_manifest()
    return {
        "source_dir": str(Path(settings.rag_source_dir).resolve()),
        "manifest_path": str(Path(settings.rag_manifest_path).resolve()),
        "milvus_collection": settings.milvus_collection,
        "milvus_configured": bool(settings.milvus_uri and settings.milvus_collection),
        "manifest": manifest,
    }


def reindex_rag(*, force: bool = False) -> dict[str, Any]:
    ensure_rag_runtime()
    docs = _load_source_documents(Path(settings.rag_source_dir))
    fingerprint = _fingerprint(docs)
    previous = _load_manifest()

    if not force and previous.get("fingerprint") == fingerprint:
        return {
            "status": "skipped",
            "reason": "no_changes",
            "documents": len(docs),
            "fingerprint": fingerprint,
        }

    if not docs:
        result = {
            "status": "skipped",
            "reason": "no_documents",
            "documents": 0,
            "fingerprint": fingerprint,
        }
        _save_manifest(result)
        return result

    if not settings.milvus_uri or not settings.milvus_collection:
        result = {
            "status": "skipped",
            "reason": "milvus_not_configured",
            "documents": len(docs),
            "fingerprint": fingerprint,
        }
        _save_manifest(result)
        return result

    records: list[dict[str, Any]] = []
    for doc in docs:
        vector = embed_text(doc["text"])
        if not vector:
            continue
        record = dict(doc)
        record["vector"] = vector
        records.append(record)

    if not records:
        result = {
            "status": "skipped",
            "reason": "embedding_failed",
            "documents": len(docs),
            "indexed": 0,
            "fingerprint": fingerprint,
        }
        _save_manifest(result)
        return result

    try:
        _rebuild_collection(records)
    except Exception as exc:
        logger.warning("RAG reindex failed: %s", exc.__class__.__name__)
        result = {
            "status": "error",
            "reason": exc.__class__.__name__,
            "documents": len(docs),
            "indexed": 0,
            "fingerprint": fingerprint,
        }
        _save_manifest(result)
        return result

    result = {
        "status": "ok",
        "documents": len(docs),
        "indexed": len(records),
        "fingerprint": fingerprint,
        "reindexed_at": datetime.utcnow().isoformat() + "Z",
    }
    _save_manifest(result)
    return result


def _rebuild_collection(records: list[dict[str, Any]]) -> None:
    if not records:
        return
    vector_dim = len(records[0]["vector"])
    collection_name = settings.milvus_collection

    from pymilvus import MilvusClient  # type: ignore

    client = MilvusClient(
        uri=settings.milvus_uri,
        token=settings.milvus_token or None,
        db_name=settings.milvus_db_name or "default",
    )

    try:
        if client.has_collection(collection_name=collection_name):
            client.drop_collection(collection_name=collection_name)
    except Exception:
        pass

    client.create_collection(
        collection_name=collection_name,
        dimension=vector_dim,
        metric_type="COSINE",
        consistency_level="Strong",
    )

    payload = [
        {
            "id": row["id"],
            "vector": row["vector"],
            "text": row["text"],
            "source": row["source"],
            "version": row["version"],
            "updated_at": row["updated_at"],
            "title": row.get("title", ""),
        }
        for row in records
    ]
    client.insert(collection_name=collection_name, data=payload)


def _load_source_documents(source_dir: Path) -> list[dict[str, Any]]:
    if not source_dir.exists():
        return []

    docs: list[dict[str, Any]] = []
    files = sorted(path for path in source_dir.rglob("*") if path.is_file())
    for path in files:
        suffix = path.suffix.lower()
        if suffix in {".md", ".txt"}:
            docs.extend(_load_text_file(path, source_dir))
        elif suffix == ".json":
            docs.extend(_load_json_file(path, source_dir))
        elif suffix == ".jsonl":
            docs.extend(_load_jsonl_file(path, source_dir))
    return docs


def _load_text_file(path: Path, base_dir: Path) -> list[dict[str, Any]]:
    try:
        content = path.read_text(encoding="utf-8").strip()
    except Exception:
        return []
    if not content:
        return []

    chunks = _chunk_text(content, max_chars=max(400, settings.rag_chunk_size))
    meta = _source_meta(path, base_dir)
    docs: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks):
        docs.append(
            {
                "id": f"{meta['source']}#{index}",
                "text": chunk,
                "title": path.stem,
                "source": meta["source"],
                "version": meta["version"],
                "updated_at": meta["updated_at"],
            }
        )
    return docs


def _load_json_file(path: Path, base_dir: Path) -> list[dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []

    if isinstance(payload, dict) and isinstance(payload.get("documents"), list):
        rows = payload.get("documents")
    elif isinstance(payload, list):
        rows = payload
    else:
        return []

    return _json_rows_to_docs(rows, path, base_dir)


def _load_jsonl_file(path: Path, base_dir: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    try:
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line:
                continue
            data = json.loads(line)
            if isinstance(data, dict):
                rows.append(data)
    except Exception:
        return []
    return _json_rows_to_docs(rows, path, base_dir)


def _json_rows_to_docs(rows: list[Any], path: Path, base_dir: Path) -> list[dict[str, Any]]:
    default_meta = _source_meta(path, base_dir)
    docs: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            continue
        text = _text_field(row, "text", "content", "chunk", "body")
        if not text:
            continue
        source = str(row.get("source") or default_meta["source"])
        version = str(row.get("version") or default_meta["version"])
        updated_at = str(row.get("updated_at") or default_meta["updated_at"])
        title = str(row.get("title") or path.stem)
        docs.append(
            {
                "id": f"{source}#{index}",
                "text": text,
                "title": title,
                "source": source,
                "version": version,
                "updated_at": updated_at,
            }
        )
    return docs


def _source_meta(path: Path, base_dir: Path) -> dict[str, str]:
    source = str(path.relative_to(base_dir)).replace("\\", "/")
    updated_at = datetime.utcfromtimestamp(path.stat().st_mtime).isoformat() + "Z"
    version = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    return {"source": source, "updated_at": updated_at, "version": version}


def _chunk_text(text: str, *, max_chars: int) -> list[str]:
    paragraphs = [line.strip() for line in text.splitlines() if line.strip()]
    if not paragraphs:
        return []
    chunks: list[str] = []
    buf = ""
    for paragraph in paragraphs:
        candidate = paragraph if not buf else f"{buf}\n{paragraph}"
        if len(candidate) <= max_chars:
            buf = candidate
            continue
        if buf:
            chunks.append(buf)
        if len(paragraph) <= max_chars:
            buf = paragraph
            continue
        start = 0
        while start < len(paragraph):
            part = paragraph[start:start + max_chars]
            chunks.append(part)
            start += max_chars
        buf = ""
    if buf:
        chunks.append(buf)
    return chunks


def _text_field(item: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _fingerprint(docs: list[dict[str, Any]]) -> str:
    raw = json.dumps(
        [{"id": doc["id"], "version": doc["version"], "updated_at": doc["updated_at"]} for doc in docs],
        ensure_ascii=True,
        sort_keys=True,
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _load_manifest() -> dict[str, Any]:
    path = Path(settings.rag_manifest_path)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_manifest(data: dict[str, Any]) -> None:
    path = Path(settings.rag_manifest_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=True, indent=2), encoding="utf-8")
