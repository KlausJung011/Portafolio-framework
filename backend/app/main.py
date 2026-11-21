import secrets
import time
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import delete, select, text, update
from sqlalchemy.orm import Session
from .database import get_db
from .models import Admin, AdminSession, Message, Portfolio
from .schemas import Contact, Login, MessageStatus, PortfolioUpdate
from .security import COOKIE_NAME, COOKIE_SECURE, DUMMY_HASH, digest, password_hash, require_admin, require_csrf

app = FastAPI(title="API del portafolio", docs_url=None, redoc_url=None)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    if request.url.path.startswith("/api/admin"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    if not db.get(Portfolio, 1):
        raise HTTPException(503, "Falta inicializar la base de datos")
    return {"status": "ok"}


@app.get("/api/portfolio")
def portfolio(db: Session = Depends(get_db)):
    row = db.get(Portfolio, 1)
    if not row:
        raise HTTPException(503, "Contenido aún no disponible")
    return {"revision": row.revision, "content": row.content}


@app.post("/api/contact", status_code=201)
@limiter.limit("5/minute")
def contact(request: Request, payload: Contact, db: Session = Depends(get_db)):
    if payload.website:
        raise HTTPException(422, "Formulario no válido")
    row = Message(**payload.model_dump(exclude={"consent", "website"}), created_at=time.time())
    db.add(row)
    db.commit()
    return {"id": row.id, "detail": "Mensaje recibido. Gracias por contactarme."}


@app.post("/api/admin/login", dependencies=[Depends(require_csrf)])
@limiter.limit("5/minute")
def login(request: Request, payload: Login, response: Response, db: Session = Depends(get_db)):
    admin = db.get(Admin, payload.username)
    valid = password_hash.verify(payload.password, admin.password_hash if admin else DUMMY_HASH)
    if not admin or not valid:
        raise HTTPException(401, "Usuario o contraseña incorrectos")
    db.execute(delete(AdminSession).where(AdminSession.expires_at < time.time()))
    old_token = request.cookies.get(COOKIE_NAME)
    if old_token:
        db.execute(delete(AdminSession).where(AdminSession.token_hash == digest(old_token)))
    token = secrets.token_urlsafe(48)
    db.add(AdminSession(token_hash=digest(token), username=admin.username, expires_at=time.time() + 28800))
    db.commit()
    response.set_cookie(COOKIE_NAME, token, max_age=28800, httponly=True, secure=COOKIE_SECURE, samesite="strict", path="/api/admin")
    return {"username": admin.username}


@app.get("/api/admin/me")
def me(session: AdminSession = Depends(require_admin)):
    return {"username": session.username}


@app.post("/api/admin/logout", dependencies=[Depends(require_csrf)])
def logout(response: Response, session: AdminSession = Depends(require_admin), db: Session = Depends(get_db)):
    db.delete(session)
    db.commit()
    response.delete_cookie(COOKIE_NAME, path="/api/admin", secure=COOKIE_SECURE, httponly=True, samesite="strict")
    return {"detail": "Sesión cerrada"}


@app.put("/api/admin/portfolio", dependencies=[Depends(require_admin), Depends(require_csrf)])
def save_portfolio(payload: PortfolioUpdate, db: Session = Depends(get_db)):
    result = db.execute(update(Portfolio).where(Portfolio.id == 1, Portfolio.revision == payload.revision).values(content=payload.content.model_dump(mode="json"), revision=payload.revision + 1))
    if result.rowcount != 1:
        db.rollback()
        raise HTTPException(409, "Otra sesión modificó el contenido. Recarga antes de editar.")
    db.commit()
    return {"revision": payload.revision + 1, "content": payload.content.model_dump(mode="json")}


@app.get("/api/admin/messages", dependencies=[Depends(require_admin)])
def messages(offset: int = 0, db: Session = Depends(get_db)):
    rows = db.scalars(select(Message).order_by(Message.id.desc()).offset(max(0, offset)).limit(100)).all()
    return [{"id": row.id, "name": row.name, "email": row.email, "phone": row.phone, "message": row.message, "created_at": row.created_at, "attended": row.attended} for row in rows]


@app.patch("/api/admin/messages/{message_id}", dependencies=[Depends(require_admin), Depends(require_csrf)])
def message_status(message_id: int, payload: MessageStatus, db: Session = Depends(get_db)):
    row = db.get(Message, message_id)
    if not row:
        raise HTTPException(404, "Mensaje no encontrado")
    row.attended = payload.attended
    db.commit()
    return {"id": row.id, "attended": row.attended}


@app.delete("/api/admin/messages/{message_id}", status_code=204, dependencies=[Depends(require_admin), Depends(require_csrf)])
def delete_message(message_id: int, db: Session = Depends(get_db)):
    row = db.get(Message, message_id)
    if not row:
        raise HTTPException(404, "Mensaje no encontrado")
    db.delete(row)
    db.commit()
    return Response(status_code=204)
