"""
AI/app/core/jwt_auth.py

Spring과 동일한 HS256 JWT 검증 — optional 방식
- 토큰 있으면 파싱해서 userId/role 반환
- 토큰 없으면 guest로 처리 (Spring /ai/** permitAll과 동일)
- 토큰 있는데 위조/만료면 401 반환

환경변수: JWT_SECRET (Spring jwt.secret과 동일한 값)
"""
import os
import logging
from typing import Optional
from dataclasses import dataclass

from fastapi import Header, HTTPException
import jwt  # PyJWT

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_TO_A_SECURE_SECRET_AT_LEAST_32_BYTES_LONG")
JWT_ALGORITHM = "HS256"


@dataclass
class TokenUser:
    user_id: str
    role: str       # "admin" | "user" | "tenant" | "guest"
    is_guest: bool


def get_optional_user(
    authorization: Optional[str] = Header(default=None)
) -> TokenUser:
    """
    FastAPI Depends로 사용.
    토큰 없음  → guest 반환 (Spring permitAll과 동일)
    토큰 있음  → 검증 후 TokenUser 반환
    토큰 위조  → 401
    """
    if not authorization or not authorization.startswith("Bearer "):
        return TokenUser(user_id="guest", role="guest", is_guest=True)

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        # Spring JwtProvider와 동일: typ=access만 허용
        if payload.get("typ") != "access":
            raise HTTPException(status_code=401, detail="access 토큰이 아닙니다.")

        user_id = payload.get("sub", "unknown")
        role    = payload.get("role", "user")
        return TokenUser(user_id=user_id, role=role, is_guest=False)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"유효하지 않은 토큰: {e}")
