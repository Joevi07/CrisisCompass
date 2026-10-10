"""Small signed-token authentication for the protected authority dashboard."""
import base64
import binascii
import hashlib
import hmac
import json
import time

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)
TOKEN_LIFETIME_SECONDS = 8 * 60 * 60


def _encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _secret() -> bytes | None:
    value = settings.ADMIN_TOKEN_SECRET
    return value.encode("utf-8") if value else None


def issue_admin_token() -> str:
    secret = _secret()
    if not secret:
        raise HTTPException(status_code=503, detail="Admin access is not configured on this server.")
    payload = _encode(json.dumps({"sub": "authority", "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS}).encode("utf-8"))
    signature = _encode(hmac.new(secret, payload.encode("ascii"), hashlib.sha256).digest())
    return f"{payload}.{signature}"


def require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> str:
    secret = _secret()
    if not secret:
        raise HTTPException(status_code=503, detail="Admin access is not configured on this server.")
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authority sign-in required.")
    try:
        payload_part, signature_part = credentials.credentials.split(".", 1)
        expected = _encode(hmac.new(secret, payload_part.encode("ascii"), hashlib.sha256).digest())
        if not hmac.compare_digest(signature_part, expected):
            raise ValueError("Invalid signature")
        padded = payload_part + "=" * (-len(payload_part) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
        if payload.get("sub") != "authority" or int(payload.get("exp", 0)) <= int(time.time()):
            raise ValueError("Expired token")
        return "authority"
    except (ValueError, TypeError, json.JSONDecodeError, binascii.Error, UnicodeEncodeError):
        raise HTTPException(status_code=401, detail="Authority session is invalid or expired.")
