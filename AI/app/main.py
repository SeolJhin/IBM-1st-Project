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
    start_reindex_daemon()
    start_stock_alert_daemon()