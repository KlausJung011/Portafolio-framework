import pytest
from pydantic import ValidationError
from app.schemas import Contact, Project
from app.security import digest, password_hash


def test_contact_rejects_missing_consent():
    with pytest.raises(ValidationError):
        Contact(name="Ana", email="ana@example.com", message="Quiero consultar un proyecto", consent=False)


def test_project_rejects_script_url():
    with pytest.raises(ValidationError):
        Project(title="Proyecto", description="Descripción", tags=[], repository="javascript:alert(1)")


def test_password_hash_and_session_token():
    hashed = password_hash.hash("UnaClaveDePrueba1234")
    assert hashed != "UnaClaveDePrueba1234"
    assert password_hash.verify("UnaClaveDePrueba1234", hashed)
    assert not password_hash.verify("incorrecta", hashed)
    assert len(digest("token")) == 64
