"""SQLAlchemy 2 models for Domain C (Consent texts and explicit user consents)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class ConsentText(Base):
    """Versioned legal text for processing followed person health data."""

    __tablename__ = "consent_texts"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="fr", nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    __table_args__ = (Index("ix_consent_texts_lang_current", "language", "is_current"),)


class Consent(Base):
    """Explicit consent given by an authorized account holder for a followed person."""

    __tablename__ = "consents"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    consent_text_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("consent_texts.id"), nullable=False, index=True
    )
    given_by_user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=False, index=True
    )
    legal_guardian: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    given_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_consents_person_withdrawn", "person_id", "withdrawn_at"),)
