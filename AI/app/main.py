import logging
import os
import sys
import threading
from contextlib import asynccontextmanager

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


def _run_startup_warmup_tasks() -> None:
    # Keep heavyweight startup work out of the main boot path.
    try:
        from app.integrations.milvus_client import embed_text

        logger.info("[Warmup] embedding model warmup started")
        embed_text("warmup")
        logger.info("[Warmup] embedding model warmup finished")
    except Exception as e:
        logger.warning("[Warmup] embedding model warmup failed (ignored): %s", e)

    try:
        from app.services.rag.index_pipeline import reindex_rag

        result = reindex_rag(force=False)
        logger.info(
            "[RAG] reindex result: status=%s documents=%s indexed=%s",
            result.get("status"),
            result.get("documents"),
            result.get("indexed"),
        )
    except Exception as e:
        logger.warning("[RAG] reindex failed (ignored): %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_rag_runtime()
    start_reindex_daemon()
    start_stock_alert_daemon()

    threading.Thread(
        target=_run_startup_warmup_tasks,
        name="startup-warmup",
        daemon=True,
    ).start()

    yield


app = FastAPI(title="Uniplace AI Service", version="0.1.0", lifespan=lifespan)

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
        "tip": ".env set MOLIT_API_KEY then restart uvicorn",
    }
