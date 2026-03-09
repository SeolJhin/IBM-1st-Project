from fastapi import FastAPI
from app.api.v1.router import router as api_v1_router
from app.services.rag.index_pipeline import ensure_rag_runtime
from app.services.rag.reindex_daemon import start_reindex_daemon

app = FastAPI(title="Uniplace AI Service", version="0.1.0")
app.include_router(api_v1_router)


@app.on_event("startup")
def _startup_rag_pipeline() -> None:
    ensure_rag_runtime()
    start_reindex_daemon()
