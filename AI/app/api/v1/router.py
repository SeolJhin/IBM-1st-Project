from fastapi import APIRouter

from app.api.v1.routes_ai import router as ai_legacy_router
from app.api.v1.routes_ai_rest import router as ai_rest_router

router = APIRouter()
router.include_router(ai_legacy_router)
router.include_router(ai_rest_router)
