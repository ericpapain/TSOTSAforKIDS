"""SQLAlchemy models for Domain Clinical (Evaluations and Scores)."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class Evaluation(Base):
    """Clinical evaluation recorded by a caregiver in an establishment."""

    __tablename__ = "evaluations"
    __table_args__ = (
        Index("ix_evaluations_person_date", "person_id", "measured_at"),
        Index("ix_evaluations_org", "organization_id"),
    )

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    person_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("organizations.id"), nullable=False
    )
    caregiver_id: Mapped[str] = mapped_column(BinaryUUID, ForeignKey("users.id"), nullable=False)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(6, 3), nullable=False)
    length_cm: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    position: Mapped[str] = mapped_column(String(20), nullable=False)  # recumbent, standing
    muac_mm: Mapped[Decimal | None] = mapped_column(Numeric(6, 1), nullable=True)
    edema: Mapped[str] = mapped_column(String(20), default="none", nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    weight_gain_velocity: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    proposed_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    proposed_criteria: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    scores: Mapped[list[EvaluationScore]] = relationship(
        "EvaluationScore",
        back_populates="evaluation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class EvaluationScore(Base):
    """Computed z-score and clinical flags for a specific anthropometric indicator."""

    __tablename__ = "evaluation_scores"
    __table_args__ = (Index("ix_eval_scores_eval_ind", "evaluation_id", "indicator"),)

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    evaluation_id: Mapped[str] = mapped_column(
        BinaryUUID, ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False
    )
    indicator: Mapped[str] = mapped_column(String(20), nullable=False)  # wfl, lhfa, wfa, acfa, bfa
    z_score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    flag: Mapped[str | None] = mapped_column(String(30), nullable=True)  # extreme, oedema
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    evaluation: Mapped[Evaluation] = relationship("Evaluation", back_populates="scores")
