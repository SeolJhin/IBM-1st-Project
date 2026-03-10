from __future__ import annotations

import logging
import threading
import time

from app.config.settings import settings
from app.services.rag.index_pipeline import reindex_rag

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_started = False


def trigger_reindex(*, force: bool = False) -> dict:
    with _lock:
        return reindex_rag(force=force)


def start_reindex_daemon() -> None:
    global _started
    if _started or not settings.rag_auto_reindex_enabled:
        return
    _started = True

    thread = threading.Thread(target=_loop, name="rag-reindex-daemon", daemon=True)
    thread.start()


def _loop() -> None:
    interval = max(30, int(settings.rag_reindex_interval_seconds))
    while True:
        try:
            result = trigger_reindex(force=False)
            status = result.get("status")
            if status not in {"skipped", "ok"}:
                logger.warning("RAG reindex daemon status=%s reason=%s", status, result.get("reason"))
        except Exception as exc:
            logger.warning("RAG reindex daemon failed: %s", exc.__class__.__name__)
        time.sleep(interval)
