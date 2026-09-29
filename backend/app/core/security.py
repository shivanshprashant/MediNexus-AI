"""
Password hashing (bcrypt via passlib) and JWT access/refresh token handling.
This replaces the simulated frontend login (LoginPage.tsx's setTimeout mock)
with real, verifiable credentials and tokens.
"""
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import bcrypt

from app.core.config import settings

# A precomputed dummy hash used to keep login timing/shape constant when an
# email doesn't exist, so responses don't leak which emails are registered.
_DUMMY_HASH = bcrypt.hashpw(b"not-a-real-password-just-for-timing-parity", bcrypt.gensalt()).decode()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    except ValueError:
        return False


def verify_password_constant_shape(plain_password: str) -> None:
    """Call this when a user lookup fails, so failed logins take a similar
    amount of time whether or not the email exists (mitigates user enumeration)."""
    try:
        bcrypt.checkpw(plain_password.encode(), _DUMMY_HASH.encode())
    except ValueError:
        pass


def create_access_token(subject: str, role: str, extra_claims: Optional[dict] = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "jti": str(uuid.uuid4()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> tuple[str, str]:
    """Returns (raw_token_for_cookie, sha256_hash_for_db_storage).

    We never store the raw refresh token — only its hash — so a stolen DB
    dump doesn't hand over usable tokens (same principle as password hashing).
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=settings.refresh_token_expire_days),
        "jti": str(uuid.uuid4()),
    }
    raw = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hashed


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def decode_token(token: str) -> dict:
    """Raises jwt.PyJWTError (or a subclass) on invalid/expired tokens —
    let callers catch that explicitly rather than swallowing errors here."""
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

decode_access_token = decode_token
