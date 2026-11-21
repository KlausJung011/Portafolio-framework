from typing import Annotated
from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=6000)]
Short = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Profile(StrictModel):
    name: Text
    title: Text
    email: EmailStr
    phone: Short
    location: Text
    availability: Text
    about: list[LongText] = Field(max_length=10)


class Card(StrictModel):
    title: Text
    description: LongText
    icon: Short = "fas fa-star"


class Skill(StrictModel):
    name: Text
    level: int = Field(ge=0, le=100)


class TechGroup(StrictModel):
    title: Text
    tags: list[Text] = Field(max_length=50)


class Language(StrictModel):
    name: Text
    flag: Short
    level: int = Field(ge=0, le=100)
    badge: Text
    description: LongText


class Timeline(StrictModel):
    title: Text
    organization: Text
    period: Text
    description: LongText
    tags: list[Text] = Field(max_length=30)


class Course(StrictModel):
    title: Text
    provider: Text
    year: Text


class Project(StrictModel):
    title: Text
    description: LongText
    tags: list[Text] = Field(max_length=30)
    status: Short = ""
    repository: Short = ""
    demo: Short = ""
    icon: Short = "fas fa-code"

    @field_validator("repository", "demo")
    @classmethod
    def safe_link(cls, value):
        if value and not value.startswith(("https://", "http://")):
            raise ValueError("El enlace debe comenzar con https:// o http://")
        return value


class Content(StrictModel):
    profile: Profile
    interests: list[Card] = Field(max_length=50)
    tech_groups: list[TechGroup] = Field(max_length=20)
    skills: list[Skill] = Field(max_length=50)
    languages: list[Language] = Field(max_length=20)
    soft_skills: list[Card] = Field(max_length=50)
    education: list[Timeline] = Field(max_length=50)
    courses: list[Course] = Field(max_length=100)
    experience: list[Timeline] = Field(max_length=50)
    projects: list[Project] = Field(max_length=100)


class PortfolioUpdate(StrictModel):
    revision: int = Field(ge=1)
    content: Content


class Contact(StrictModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    email: EmailStr = Field(max_length=254)
    phone: str = Field(default="", max_length=40)
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=4000)]
    consent: bool
    website: str = Field(default="", max_length=200)

    @field_validator("consent")
    @classmethod
    def require_consent(cls, value):
        if not value:
            raise ValueError("Debes aceptar el almacenamiento de tus datos para responderte")
        return value


class Login(StrictModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=256)


class MessageStatus(StrictModel):
    attended: bool
