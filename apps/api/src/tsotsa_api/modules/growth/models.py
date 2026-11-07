"""SQLAlchemy models for Domain Growth (WHO Growth Standards)."""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from sqlalchemy import Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from tsotsa_api.core.database import Base
from tsotsa_api.shared.types import BinaryUUID, generate_uuid7


class GrowthReference(Base):
    """Official WHO Child Growth Standards 2006 reference points."""

    __tablename__ = "growth_references"
    __table_args__ = (Index("ix_growth_ref_lookup", "indicator", "sex", "x_value", unique=True),)

    id: Mapped[str] = mapped_column(BinaryUUID, primary_key=True, default=generate_uuid7)
    indicator: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # wfl, wfh, lhfa, wfa, acfa, bfa
    sex: Mapped[Literal["F", "M"]] = mapped_column(String(1), nullable=False)
    x_value: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    l: Mapped[Decimal] = mapped_column(Numeric(10, 6), nullable=False)  # noqa: E741
    m: Mapped[Decimal] = mapped_column(Numeric(12, 6), nullable=False)
    s: Mapped[Decimal] = mapped_column(Numeric(10, 6), nullable=False)
    sd4neg: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
    sd3neg: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    sd2neg: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    sd1neg: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
    sd0: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    sd1: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
    sd2: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    sd3: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    sd4: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)
