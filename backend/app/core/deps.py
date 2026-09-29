"""
Auth dependencies: who is the caller (get_current_user), what role are they
(require_role), and — critically — do they actually own the record they're
asking for (require_owner_or_role). Role checks alone are not enough: a
"doctor" role check doesn't stop Doctor A from reading Doctor B's patients.
Every record-level endpoint should also check ownership/scope.
"""
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_token

# auto_error=False because we primarily read the token from an httpOnly
# cookie (see routers/auth.py); this scheme just also supports a bearer
# header for non-browser API clients (mobile apps, service-to-service calls).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
) -> dict:
    raw_token = request.cookies.get("access_token") or bearer_token
    if raw_token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    try:
        payload = decode_token(raw_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired, please log in again")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication token")

    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong token type presented")

    return {
        "user_id": payload["sub"],
        "role": payload["role"],
        "hospital_id": payload.get("hospital_id"),
    }

async def get_optional_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[dict]:
    raw_token = request.cookies.get("access_token") or bearer_token
    if raw_token is None:
        return None

    try:
        payload = decode_token(raw_token)
        if payload.get("type") != "access":
            return None
        return {
            "user_id": payload["sub"],
            "role": payload["role"],
            "hospital_id": payload.get("hospital_id"),
        }
    except Exception:
        return None


def require_role(*allowed_roles: str):
    """Usage: dependencies=[Depends(require_role('doctor', 'hospital_admin'))]"""

    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in allowed_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your role cannot access this resource")
        return user

    return checker


def require_same_hospital(*elevated_roles: str):
    """Restricts doctors/admins to resources within their own hospital_id,
    even if their role would otherwise permit the action. Prevents a doctor
    at Hospital A from querying patient data scoped to Hospital B."""

    async def checker(hospital_id: str, user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in elevated_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        if user["hospital_id"] != hospital_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this hospital's data")
        return user

    return checker


async def require_self_or_role(
    patient_id: str,
    *elevated_roles: str,
    user: dict = Depends(get_current_user),
) -> dict:
    """A patient may only ever access their own UHID-linked record. Doctors/
    admins bypass this only via an explicitly allowed elevated role — never
    implicitly."""
    if user["role"] in elevated_roles:
        return user
    if user["role"] == "patient" and user["user_id"] == patient_id:
        return user
    raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this patient's record")
