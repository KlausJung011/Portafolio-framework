from sqlalchemy import func, select
from app.models import Message

CONTACT = {"name": "Ana", "email": "ana@example.com", "phone": "12345678", "message": "Me interesa desarrollar una web", "consent": True}
CSRF = {"X-CSRF-Protection": "1"}


def test_public_portfolio_reads_database(client):
    response = client.get("/api/portfolio")
    assert response.status_code == 200
    assert len(response.json()["content"]["projects"]) == 7
    assert "password" not in response.text


def test_contact_persists_message_and_is_private(client, db_session):
    response = client.post("/api/contact", json=CONTACT)
    assert response.status_code == 201
    stored = db_session.get(Message, response.json()["id"])
    assert stored.email == CONTACT["email"]
    assert client.get("/api/admin/messages").status_code == 401


def test_invalid_contact_never_reaches_database(client, db_session):
    response = client.post("/api/contact", json={**CONTACT, "email": "incorrecto"})
    assert response.status_code == 422
    assert db_session.scalar(select(func.count()).select_from(Message)) == 0


def test_admin_edits_persist_and_stale_revision_is_rejected(admin_client):
    payload = admin_client.get("/api/portfolio").json()
    payload["content"]["profile"]["title"] = "Título editado desde pruebas"
    response = admin_client.put("/api/admin/portfolio", headers=CSRF, json=payload)
    assert response.status_code == 200
    assert admin_client.get("/api/portfolio").json()["content"]["profile"]["title"] == "Título editado desde pruebas"
    assert admin_client.put("/api/admin/portfolio", headers=CSRF, json=payload).status_code == 409


def test_csrf_and_logout_invalidate_access(admin_client):
    payload = admin_client.get("/api/portfolio").json()
    assert admin_client.put("/api/admin/portfolio", json=payload).status_code == 403
    assert admin_client.post("/api/admin/logout", headers=CSRF).status_code == 200
    assert admin_client.get("/api/admin/messages").status_code == 401


def test_admin_can_attend_and_remove_message(admin_client, db_session):
    row_id = admin_client.post("/api/contact", json=CONTACT).json()["id"]
    assert admin_client.patch(f"/api/admin/messages/{row_id}", headers=CSRF, json={"attended": True}).status_code == 200
    assert admin_client.get("/api/admin/messages").json()[0]["attended"] is True
    assert admin_client.delete(f"/api/admin/messages/{row_id}", headers=CSRF).status_code == 204
    assert db_session.get(Message, row_id) is None
