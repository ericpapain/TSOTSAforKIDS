"""SQLAlchemy 2 models for Domain C (Persons, Family Links, Care, and Invitations)."""

from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class Person(Base):
    """Followed person (child or adult) without direct login credentials."""

    __tablename__ = "persons"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    pseudonym: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[str] = mapped_column(String(10), nullable=False)
    region_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("regions.id"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    validated_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    refusal_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )

    links: Mapped[list[PersonLink]] = relationship(
        "PersonLink", back_populates="person", cascade="all, delete-orphan"
    )
    care_links: Mapped[list[PersonCare]] = relationship(
        "PersonCare", back_populates="person", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("sex IN ('M', 'F')", name="ck_persons_sex"),
        CheckConstraint(
            "status IN ('pending', 'validated', 'refused', 'archived')",
            name="ck_persons_status",
        ),
    )


class PersonLink(Base):
    """Links a followed person to family account(s) (self / child / relative)."""

    __tablename__ = "person_links"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    relation: Mapped[str] = mapped_column(String(30), default="child", nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    person: Mapped[Person] = relationship("Person", back_populates="links")

    __table_args__ = (
        CheckConstraint(
            "relation IN ('self', 'child', 'relative')",
            name="ck_person_links_relation",
        ),
        UniqueConstraint("person_id", "user_id", name="uq_person_links_person_user"),
    )


class PersonCare(Base):
    """Links a followed person to a health organization and caregiver (medical follow-up)."""

    __tablename__ = "person_care"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    primary_caregiver_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True, index=True
    )
    assigned_by: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=True
    )
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    person: Mapped[Person] = relationship("Person", back_populates="care_links")

    __table_args__ = (Index("ix_person_care_org_person", "organization_id", "person_id"),)


class PersonInvitation(Base):
    """Invitation sent to a second parent or guardian to share access to a followed person."""

    __tablename__ = "person_invitations"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    invited_by_user_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("users.id"), nullable=False
    )
    phone_or_email: Mapped[str] = mapped_column(String(255), nullable=False)
    relation: Mapped[str] = mapped_column(String(30), default="child", nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'accepted', 'expired')",
            name="ck_person_invitations_status",
        ),
    )
