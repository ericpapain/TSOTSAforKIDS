"""SQLAlchemy 2 models for Domain B (Organizations) and Domain C (Person Care isolation)."""

from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class Organization(Base):
    """Health facility or partner organization entity (hospital, CMA, health center, NGO)."""

    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    region_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("regions.id"), nullable=True, index=True
    )
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)
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

    care_links: Mapped[list[PersonCare]] = relationship(
        "PersonCare", back_populates="organization", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "type IN ('hopital', 'cma', 'centre_de_sante', 'ong')",
            name="ck_organizations_type",
        ),
        CheckConstraint(
            "status IN ('active', 'inactive')",
            name="ck_organizations_status",
        ),
    )


class Person(Base):
    """Followed person (child or adult, without needing their own account)."""

    __tablename__ = "persons"

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    pseudonym: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[str] = mapped_column(String(10), nullable=False)
    region_id: Mapped[str | None] = mapped_column(
        BinaryUUID, ForeignKey("regions.id"), nullable=True, index=True
    )
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

    care_links: Mapped[list[PersonCare]] = relationship(
        "PersonCare", back_populates="person", cascade="all, delete-orphan"
    )

    __table_args__ = (CheckConstraint("sex IN ('M', 'F')", name="ck_persons_sex"),)


class PersonCare(Base):
    """Links a followed person to a health organization and caregiver (basis for isolation)."""

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
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    person: Mapped[Person] = relationship("Person", back_populates="care_links")
    organization: Mapped[Organization] = relationship("Organization", back_populates="care_links")

    __table_args__ = (Index("ix_person_care_org_person", "organization_id", "person_id"),)
