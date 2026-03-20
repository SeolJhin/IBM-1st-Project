from __future__ import annotations

from pathlib import Path
from typing import Any

import httpx

from app.config.settings import settings


def upload_generated_file(
    local_path: Path,
    *,
    file_parent_type: str = "AI_DOCUMENT",
    file_parent_id: int = 0,
) -> dict[str, Any]:
    base_url = (settings.spring_base_url or "").rstrip("/")
    internal_token = (settings.ai_internal_token or "").strip()
    if not base_url:
        raise RuntimeError("spring_base_url is not configured")
    if not internal_token:
        raise RuntimeError("ai_internal_token is not configured")
    if not local_path.exists() or not local_path.is_file():
        raise RuntimeError(f"generated file not found: {local_path}")

    url = f"{base_url}/api/v1/ai/files/upload"
    with local_path.open("rb") as fp:
        files = {
            "files": (
                local_path.name,
                fp,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        }
        data = {
            "fileParentType": file_parent_type,
            "fileParentId": str(int(file_parent_id)),
        }
        headers = {
            "X-Internal-Token": internal_token,
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, data=data, files=files, headers=headers)
            resp.raise_for_status()
            body = resp.json()

    if not body.get("success"):
        raise RuntimeError(body.get("message") or "backend upload failed")

    upload_data = body.get("data") or {}
    file_list = upload_data.get("files") or []
    if not file_list:
        raise RuntimeError("backend upload response has no files")

    first = file_list[0] or {}
    file_id = first.get("fileId")
    if file_id is None:
        raise RuntimeError("backend upload response missing fileId")

    return {
        "file_id": int(file_id),
        "file_name": str(first.get("originFilename") or local_path.name),
        "download_url": f"/api/files/{int(file_id)}/download",
        "view_url": f"/api/files/{int(file_id)}/view",
    }

