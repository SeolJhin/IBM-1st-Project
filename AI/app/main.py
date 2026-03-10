from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import router as api_v1_router

app = FastAPI(title="Uniplace AI Service", version="0.1.0")

# ✅ 미들웨어 먼저, 라우터 나중에
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(api_v1_router)