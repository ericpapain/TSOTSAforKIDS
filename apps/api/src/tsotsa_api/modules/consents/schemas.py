"""Pydantic schemas for Domain C (Consent texts and explicit consents)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConsentTextRead(BaseModel):
    """Representation of a legal consent text version."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    version: int
    language: str
    body: str
    is_current: bool
    published_at: datetime


class ConsentTextCreate(BaseModel):
    """Payload for administration to publish a new version of consent text."""

    body: str = Field(..., min_length=10)
    language: str = Field(default="fr", min_length=2, max_length=10)


class ConsentGiveRequest(BaseModel):
    """Payload to grant health data processing consent for a person."""

    legal_guardian: bool = True
    consent_text_id: str | None = None


class ConsentRead(BaseModel):
    """Representation of an active or withdrawn consent."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    person_id: str
    consent_text_id: str
    given_by_user_id: str
    legal_guardian: bool
    given_at: datetime
    withdrawn_at: datetime | None = None
    is_active: bool
