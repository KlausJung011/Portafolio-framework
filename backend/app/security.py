import hashlib
import os
import time
from fastapi import Depends, HTTPException, Request
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from .database import get_db
from .models import AdminSession

password_hash = PasswordHash.recommended()
DUMMY_HASH = password_hash.hash("dummy-password-for-timing-only")
COOKIE_NAME = "portfolio_session"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def require_admin(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE_NAME, "")
    session = db.get(AdminSession, digest(token))
    if not session or session.expires_at <= time.time():
        raise HTTPException(401, "Inicia sesión para continuar")
    return session


def require_csrf(request: Request):
    # Un sitio externo no puede enviar este encabezado sin un preflight CORS.
    # La API no permite CORS; SameSite=Strict añade otra barrera.
    if request.headers.get("X-CSRF-Protection") != "1":
        raise HTTPException(403, "Falta protección CSRF")
