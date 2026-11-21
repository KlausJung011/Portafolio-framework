import json
import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.main import app, limiter
from app.models import Admin, Portfolio
from app.security import password_hash


@pytest.fixture
def db_session():
    url = os.getenv("TEST_DATABASE_URL", "sqlite://")
    options = {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool} if url == "sqlite://" else {}
    engine = create_engine(url, **options)
    # TEST_DATABASE_URL debe apuntar exclusivamente a una BD descartable de pruebas.
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as db:
        data = json.loads((Path(__file__).parents[1] / "app/seed.json").read_text(encoding="utf-8"))
        db.add(Portfolio(id=1, revision=1, content=data))
        db.add(Admin(username="admin", password_hash=password_hash.hash("TestPasswordForCI12345678")))
        db.commit()
        yield db
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def client(db_session):
    def override():
        yield db_session
    app.dependency_overrides[get_db] = override
    limiter.reset()
    with TestClient(app) as instance:
        yield instance
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client(client):
    response = client.post("/api/admin/login", headers={"X-CSRF-Protection": "1"}, json={"username": "admin", "password": "TestPasswordForCI12345678"})
    assert response.status_code == 200
    return client
