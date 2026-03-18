import logging
import os
import sys
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.config.settings import settings
from app.services.monitor.stock_alert_service import start_stock_alert_daemon
from app.services.rag.index_pipeline import ensure_rag_runtime
from app.services.rag.reindex_daemon import start_reindex_daemon


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Uniplace AI Service", version="0.1.0")

_cors_origins = [
    origin.strip()
    for origin in (settings.cors_allowed_origins or "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(api_v1_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _run_startup_chroma_index() -> None:
    try:
        from app.services.rag.chroma_rag import chroma_rag_index

        result = chroma_rag_index(force=False)
        logger.info("[Startup] ChromaRAG index result: %s", result)
    except Exception as exc:
        logger.warning("[Startup] ChromaRAG index failed: %s", exc)


@app.on_event("startup")
def _startup_rag_pipeline() -> None:
    ensure_rag_runtime()
    # In production, skip eager startup indexing by default to avoid memory spikes.
    startup_index_enabled = os.environ.get("RAG_STARTUP_INDEX_ENABLED", "false").lower() == "true"
    if startup_index_enabled:
        threading.Thread(target=_run_startup_chroma_index, daemon=True).start()
    else:
        logger.info("[Startup] Skip ChromaRAG startup indexing (RAG_STARTUP_INDEX_ENABLED=false)")
    start_reindex_daemon()
    start_stock_alert_daemon()


@app.get("/health/molit")
def health_molit() -> dict:
    settings_key = getattr(settings, "molit_api_key", "") or ""
    env_key = os.environ.get("MOLIT_API_KEY", "")
    final_key = settings_key or env_key

    def preview(key: str) -> str:
        if not key:
            return "not_set"
        if len(key) <= 8:
            return "set"
        return f"{key[:4]}****{key[-4:]}"

    return {
        "molit_key_loaded": bool(final_key),
        "molit_key_preview": preview(final_key),
        "source": "settings/.env" if settings_key else ("os.environ" if env_key else "none"),
        "env_file": str(settings.model_config.get("env_file", "unknown")),
        "kakao_key_loaded": bool(getattr(settings, "kakao_map_api_key", "")),
        "tip": "Set MOLIT_API_KEY in env and restart the app.",
    }
