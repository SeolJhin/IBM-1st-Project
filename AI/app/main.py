import logging
import sys

# ── 로깅 설정 (uvicorn 시작과 동시에 적용) ────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import router as api_v1_router
from app.services.rag.index_pipeline import ensure_rag_runtime
from app.services.rag.reindex_daemon import start_reindex_daemon
from app.services.monitor.stock_alert_service import start_stock_alert_daemon

app = FastAPI(title="Uniplace AI Service", version="0.1.0")


# 미들웨어 먼저, 라우터 나중에
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(api_v1_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def _startup_rag_pipeline() -> None:
    ensure_rag_runtime()
    # ChromaDB RAG 인덱싱 (rag_docs/ 폴더의 txt/md 파일)
    try:
        from app.services.rag.chroma_rag import chroma_rag_index
        result = chroma_rag_index(force=False)
        import logging
        logging.getLogger(__name__).info("[Startup] ChromaRAG 인덱싱 결과: %s", result)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("[Startup] ChromaRAG 인덱싱 실패: %s", e)
    start_reindex_daemon()
    start_stock_alert_daemon()

@app.get("/health/molit")
def health_molit() -> dict:
    """국토부 API 키 로딩 상태 진단. GET /health/molit"""
    import os
    from app.config.settings import settings

    settings_key = getattr(settings, "molit_api_key", "") or ""
    env_key = os.environ.get("MOLIT_API_KEY", "")
    final_key = settings_key or env_key

    def preview(k):
        if not k:
            return "❌ 없음"
        return k[:4] + "****" + k[-4:] if len(k) > 8 else "설정됨(짧음)"

    return {
        "molit_key_loaded": bool(final_key),
        "molit_key_preview": preview(final_key),
        "source": "settings/.env" if settings_key else ("os.environ" if env_key else "없음"),
        "env_file": str(settings.model_config.get("env_file", "알수없음")),
        "kakao_key_loaded": bool(getattr(settings, "kakao_map_api_key", "")),
        "tip": ".env 파일에 MOLIT_API_KEY=발급키 추가 후 uvicorn 재시작 필요",
    }