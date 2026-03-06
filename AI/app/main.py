from fastapi import FastAPI
from app.api.v1.routes_ai import router as ai_router

app = FastAPI(title="Uniplace AI Service", version="0.1.0")
app.include_router(ai_router)
