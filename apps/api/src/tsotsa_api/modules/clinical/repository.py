"""Database repository for Domain Clinical (Evaluations and Scores)."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from tsotsa_api.modules.clinical.models import Evaluation, EvaluationScore
from tsotsa_api.shared.types import generate_uuid7


def _is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(val)
        return True
    except (ValueError, TypeError):
        return False


class ClinicalRepository:
    """Handles persistence of clinical evaluations and calculated scores."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, evaluation_id: str) -> Evaluation | None:
        if not _is_valid_uuid(evaluation_id):
            return None
        stmt = (
            select(Evaluation)
            .options(selectinload(Evaluation.scores))
            .where(Evaluation.id == evaluation_id)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_latest_evaluation(self, person_id: str) -> Evaluation | None:
        if not _is_valid_uuid(person_id):
            return None
        stmt = (
            select(Evaluation)
            .options(selectinload(Evaluation.scores))
            .where(Evaluation.person_id == person_id)
            .order_by(Evaluation.measured_at.desc())
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_for_person(
        self,
        person_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Evaluation]:
        if not _is_valid_uuid(person_id):
            return []
        stmt = (
            select(Evaluation)
            .options(selectinload(Evaluation.scores))
            .where(Evaluation.person_id == person_id)
            .order_by(Evaluation.measured_at.desc())
            .offset(offset)
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def create_evaluation(
        self,
        person_id: str,
        organization_id: str,
        caregiver_id: str,
        measured_at: datetime,
        weight_kg: Decimal,
        length_cm: Decimal,
        position: str,
        muac_mm: Decimal | None,
        edema: str,
        notes: str | None = None,
        weight_gain_velocity: Decimal | None = None,
        proposed_status: str | None = None,
        proposed_criteria: str | None = None,
    ) -> Evaluation:
        eval_id = generate_uuid7()
        record = Evaluation(
            id=eval_id,
            person_id=person_id,
            organization_id=organization_id,
            caregiver_id=caregiver_id,
            measured_at=measured_at,
            weight_kg=weight_kg,
            length_cm=length_cm,
            position=position,
            muac_mm=muac_mm,
            edema=edema,
            notes=notes,
            weight_gain_velocity=weight_gain_velocity,
            proposed_status=proposed_status,
            proposed_criteria=proposed_criteria,
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def add_score(
        self,
        evaluation_id: str,
        indicator: str,
        z_score: Decimal | None,
        flag: str | None = None,
    ) -> EvaluationScore:
        record = EvaluationScore(
            id=generate_uuid7(),
            evaluation_id=evaluation_id,
            indicator=indicator,
            z_score=z_score,
            flag=flag,
        )
        self.session.add(record)
        await self.session.flush()
        return record
