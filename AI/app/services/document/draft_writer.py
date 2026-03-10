from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.config.settings import BASE_DIR, settings


def write_document_draft(kind: str, payload: dict[str, Any], user_id: str | None = None) -> str:
    output_dir = _resolve_runtime_dir(settings.document_output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    _apply_permissions(output_dir, is_dir=True)

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    user = (user_id or "anonymous").strip() or "anonymous"
    safe_kind = _normalize_name(kind)
    safe_user = _normalize_name(user)
    path = output_dir / f"{safe_kind}_{safe_user}_{timestamp}_{uuid4().hex[:8]}.json"

    body = {
        "kind": kind,
        "user_id": user_id,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "payload": payload,
    }
    path.write_text(json.dumps(body, ensure_ascii=True, indent=2), encoding="utf-8")
    _apply_permissions(path, is_dir=False)
    return str(path)


def _resolve_runtime_dir(path_value: str) -> Path:
    path = Path(path_value)
    if not path.is_absolute():
        path = BASE_DIR / path
    return path.resolve()


def _normalize_name(value: str) -> str:
    lowered = value.strip().lower()
    if not lowered:
        return "unknown"
    allowed = []
    for ch in lowered:
        if ch.isalnum() or ch in {"-", "_"}:
            allowed.append(ch)
        else:
            allowed.append("_")
    return "".join(allowed).strip("_") or "unknown"


def _apply_permissions(path: Path, *, is_dir: bool) -> None:
    mode = 0o750 if is_dir else 0o640
    try:
        os.chmod(path, mode)
    except OSError:
        pass
