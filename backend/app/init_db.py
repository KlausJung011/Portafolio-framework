"""Se ejecuta después de alembic upgrade head. Nunca reemplaza contenido editado."""
import json
import os
from pathlib import Path
from sqlalchemy import delete
from .database import SessionLocal
from .models import Admin, AdminSession, Portfolio
from .schemas import Content
from .security import password_hash


def initialize(reset_admin=False):
    username = os.environ.get("ADMIN_USERNAME", "admin")
    password = os.environ.get("ADMIN_PASSWORD", "")
    with SessionLocal() as db:
        admin = db.get(Admin, username)
        if not admin or reset_admin:
            if len(password) < 16 or password.startswith("REPLACE_"):
                raise ValueError("ADMIN_PASSWORD debe ser nueva y tener al menos 16 caracteres")
            if admin:
                admin.password_hash = password_hash.hash(password)
            else:
                db.add(Admin(username=username, password_hash=password_hash.hash(password)))
            db.execute(delete(AdminSession))
        if not db.get(Portfolio, 1):
            content = Content.model_validate_json((Path(__file__).parent / "seed.json").read_text(encoding="utf-8"))
            db.add(Portfolio(id=1, revision=1, content=content.model_dump(mode="json")))
        db.commit()


if __name__ == "__main__":
    import sys
    initialize(reset_admin="--reset-admin" in sys.argv)
    print("Base de datos inicializada")
