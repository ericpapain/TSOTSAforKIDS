"""Business logic service for Domain Clinical (Evaluations, Z-scores, and Triage)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any, Literal

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError, ValidationError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.clinical.models import Evaluation
from tsotsa_api.modules.clinical.repository import ClinicalRepository
from tsotsa_api.modules.clinical.schemas import (
    EvaluationCreate,
    EvaluationRead,
    EvaluationScoreRead,
)
from tsotsa_api.modules.consents.service import ConsentsService
from tsotsa_api.modules.growth.engine import (
    calculate_daily_weight_gain,
    propose_nutritional_status,
)
from tsotsa_api.modules.growth.service import GrowthService
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService


class ClinicalService:
    """Manages clinical consultations, anthropometric scoring, and growth monitoring."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ClinicalRepository(session)
        self.persons = PersonsService(session)
        self.consents = ConsentsService(session)
        self.organizations = OrganizationsService(session)
        self.growth = GrowthService(session)
        self.audit = AuditService(session)

    async def verify_read_access(self, user_id: str, is_admin: bool, person_id: str) -> None:
        """Allow linked family members or verified caregivers with active consent."""
        if is_admin:
            return

        if not await self.persons.person_exists(person_id):
            raise NotFoundError("Personne suivie introuvable.")

        # 1. Family member
        if await self.persons.is_person_linked_to_user(person_id=person_id, user_id=user_id):
            return

        # 2. Caregiver check
        cg_org_id = await self.organizations.get_caregiver_organization_id(user_id)
        if cg_org_id:
            person_org = await self.persons.get_active_care_organization_id(person_id)
            if person_org == cg_org_id:
                if not await self.consents.has_active_consent(person_id):
                    raise ForbiddenError(
                        "Consentement médical non accordé ou retiré. Accès soignant refusé."
                    )
                return

        raise ForbiddenError("Accès refusé pour cette personne suivie.")

    async def record_evaluation(
        self,
        caregiver_user_id: str,
        is_admin: bool,
        person_id: str,
        payload: EvaluationCreate,
        ip: str | None = None,
    ) -> EvaluationRead:
        """Record an anthropometric evaluation, compute WHO z-scores, velocity, and proposal."""
        if not await self.persons.person_exists(person_id):
            raise NotFoundError("Personne suivie introuvable.")

        org_id = await self.organizations.get_caregiver_organization_id(caregiver_user_id)
        person_org = await self.persons.get_active_care_organization_id(person_id)

        if not is_admin:
            if not org_id:
                raise ForbiddenError(
                    "Seul un soignant rattaché à un établissement peut saisir une évaluation."
                )
            if person_org != org_id:
                raise ForbiddenError(
                    "Cette personne n'est pas suivie au sein de votre établissement."
                )
            if not await self.consents.has_active_consent(person_id):
                raise ForbiddenError("Consentement médical non accordé ou retiré. Saisie refusée.")

        target_org_id = org_id or person_org or "00000000-0000-0000-0000-000000000000"

        demographics = await self.persons.get_person_demographics(person_id)
        if not demographics:
            raise NotFoundError("Informations démographiques introuvables.")
        birth_date, raw_sex = demographics
        sex: Literal["F", "M"] = "F" if raw_sex.upper() == "F" else "M"

        # Calculate age in days
        measured_date = payload.measured_at.date()
        age_days = (measured_date - birth_date).days
        if age_days < 0:
            raise ValidationError("La date de mesure ne peut pas être antérieure à la naissance.")

        # Calculate daily weight gain velocity if previous evaluation exists
        prev_eval = await self.repo.get_latest_evaluation(person_id)
        velocity = None
        if prev_eval:
            velocity = calculate_daily_weight_gain(
                weight_earlier_kg=prev_eval.weight_kg,
                date_earlier=prev_eval.measured_at,
                weight_later_kg=payload.weight_kg,
                date_later=payload.measured_at,
            )

        # Compute z-scores with WHO growth standards
        scores_result, adj_len, final_pos = await self.growth.evaluate_measurements(
            weight_kg=payload.weight_kg,
            length_cm=payload.length_cm,
            age_days=age_days,
            sex=sex,
            muac_mm=payload.muac_mm,
            position=payload.position,
            edema=payload.edema,
        )

        z_wfl = (
            Decimal(str(scores_result.z_weight_for_length))
            if scores_result.z_weight_for_length is not None
            else None
        )
        proposal = propose_nutritional_status(
            z_wfl=z_wfl,
            muac_mm=payload.muac_mm,
            edema=payload.edema,
        )

        evaluation = await self.repo.create_evaluation(
            person_id=person_id,
            organization_id=target_org_id,
            caregiver_id=caregiver_user_id,
            measured_at=payload.measured_at,
            weight_kg=payload.weight_kg,
            length_cm=adj_len,
            position=final_pos,
            muac_mm=payload.muac_mm,
            edema=payload.edema,
            notes=payload.notes,
            weight_gain_velocity=velocity,
            proposed_status=proposal.classification,
            proposed_criteria=proposal.criteria,
        )

        # Store indicator scores
        flag_wfl = (
            "extreme"
            if scores_result.is_extreme
            else ("oedema" if scores_result.edema_flag else None)
        )
        await self.repo.add_score(evaluation.id, "wfl", z_wfl, flag=flag_wfl)

        if scores_result.z_length_for_age is not None:
            await self.repo.add_score(
                evaluation.id, "lhfa", Decimal(str(scores_result.z_length_for_age))
            )
        if scores_result.z_weight_for_age is not None:
            await self.repo.add_score(
                evaluation.id, "wfa", Decimal(str(scores_result.z_weight_for_age))
            )
        if scores_result.z_muac_for_age is not None:
            await self.repo.add_score(
                evaluation.id, "acfa", Decimal(str(scores_result.z_muac_for_age))
            )
        if scores_result.z_bmi_for_age is not None:
            await self.repo.add_score(
                evaluation.id, "bfa", Decimal(str(scores_result.z_bmi_for_age))
            )

        await self.session.commit()

        await self.audit.log(
            action="create",
            entity="clinical_evaluation",
            entity_id=evaluation.id,
            actor_user_id=caregiver_user_id,
            ip=ip,
            details={
                "person_id": person_id,
                "proposed_status": proposal.classification,
                "velocity": str(velocity) if velocity else None,
            },
        )

        reloaded = await self.repo.get_by_id(evaluation.id)
        return self._to_read(reloaded or evaluation)

    async def list_evaluations(
        self,
        user_id: str,
        is_admin: bool,
        person_id: str,
        limit: int = 50,
        offset: int = 0,
        ip: str | None = None,
    ) -> list[EvaluationRead]:
        """List historical clinical consultations with computed scores."""
        await self.verify_read_access(user_id, is_admin, person_id)
        items = await self.repo.list_for_person(person_id=person_id, limit=limit, offset=offset)
        await self.audit.log(
            action="read",
            entity="clinical_evaluations_history",
            entity_id=person_id,
            actor_user_id=user_id,
            ip=ip,
            details={"count": len(items)},
        )
        return [self._to_read(it) for it in items]

    async def get_latest_evaluation(
        self, user_id: str, is_admin: bool, person_id: str
    ) -> EvaluationRead | None:
        """Fetch latest consultation record for person."""
        await self.verify_read_access(user_id, is_admin, person_id)
        record = await self.repo.get_latest_evaluation(person_id)
        return self._to_read(record) if record else None

    async def get_latest_evaluation_summary(self, person_id: str) -> EvaluationRead | None:
        """Fetch latest evaluation without user context (used by internal services)."""
        record = await self.repo.get_latest_evaluation(person_id)
        return self._to_read(record) if record else None

    async def get_growth_curves_with_points(
        self,
        user_id: str,
        is_admin: bool,
        person_id: str,
        indicator: str = "wfl",
    ) -> dict[str, Any]:
        """Fetch reference curves and overlay the child's recorded measurement points."""
        await self.verify_read_access(user_id, is_admin, person_id)
        demographics = await self.persons.get_person_demographics(person_id)
        if not demographics:
            raise NotFoundError("Personne suivie introuvable.")
        _, raw_sex = demographics
        sex: Literal["F", "M"] = "F" if raw_sex.upper() == "F" else "M"

        curves = await self.growth.get_growth_curves(indicator=indicator, sex=sex)
        evals = await self.repo.list_for_person(person_id=person_id, limit=100)

        child_points = []
        for ev in reversed(evals):
            x = ev.length_cm if indicator in ("wfl", "wfh") else None
            score = next((s.z_score for s in ev.scores if s.indicator == indicator), None)
            child_points.append(
                {
                    "date": ev.measured_at.isoformat(),
                    "x_value": float(x) if x is not None else None,
                    "weight_kg": float(ev.weight_kg),
                    "z_score": float(score) if score is not None else None,
                }
            )

        return {
            "indicator": indicator,
            "sex": sex,
            "curves": curves.model_dump(),
            "child_observations": child_points,
        }

    def _to_read(self, ev: Evaluation) -> EvaluationRead:
        score_reads = [
            EvaluationScoreRead(
                indicator=s.indicator,
                z_score=s.z_score,
                flag=s.flag,
            )
            for s in ev.scores
        ]
        return EvaluationRead(
            id=ev.id,
            person_id=ev.person_id,
            organization_id=ev.organization_id,
            caregiver_id=ev.caregiver_id,
            measured_at=ev.measured_at,
            weight_kg=ev.weight_kg,
            length_cm=ev.length_cm,
            position=ev.position,
            muac_mm=ev.muac_mm,
            edema=ev.edema,
            notes=ev.notes,
            weight_gain_velocity=ev.weight_gain_velocity,
            proposed_status=ev.proposed_status,
            proposed_criteria=ev.proposed_criteria,
            scores=score_reads,
            created_at=ev.created_at,
        )
