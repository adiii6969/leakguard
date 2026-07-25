from dataclasses import dataclass

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError

from app.core.config import get_settings

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)

JWKS_URL = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"

_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    """Fetch and cache Supabase's public JWKS (rotates rarely)."""
    global _jwks_cache
    if _jwks_cache is None:
        response = httpx.get(JWKS_URL, timeout=10)
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache


def _get_signing_key(token: str) -> dict:
    """Find the JWK matching the token's `kid` header."""
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key

    # Key not found — refresh cache once in case of rotation, then retry
    global _jwks_cache
    _jwks_cache = None
    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key

    raise JWTError("Signing key not found in JWKS")


@dataclass
class CurrentUser:
    id: str
    email: str | None
    access_token: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    """
    Validates the Supabase-issued JWT sent as `Authorization: Bearer <token>`
    by the frontend (Supabase Auth handles login/signup client-side; the
    backend only ever verifies the resulting token).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )
    token = credentials.credentials
    try:
        signing_key = _get_signing_key(token)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            audience="authenticated",
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    return CurrentUser(id=user_id, email=payload.get("email"), access_token=token)
