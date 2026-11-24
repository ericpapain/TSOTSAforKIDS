"""Router for patient validation and caregiver assignment."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity.dependencies import get_current_user, require_permission
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.persons.schemas_validation import (
    PatientAssignRequest,
    PatientDeleteRequest,
    PatientValidateAndAssignRequest,
    PatientValidationRequest,
    PendingPatientRead,
)
from tsotsa_api.modules.persons.validation_service import PatientValidationService

patient_validation_router = APIRouter(prefix="/patients", tags=["Patient Validation"])


@patient_validation_router.get(
    "/pending",
    response_model=list[PendingPatientRead],
    dependencies=[Depends(require_permission("patients.validate"))],
)
async def list_pending_patients(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[PendingPatientRead]:
    """List patients awaiting validation (requires patients.validate)."""
    service = PatientValidationService(session)
    patients = await service.list_pending_patients(current_user)
    return [PendingPatientRead.model_validate(p) for p in patients]


@patient_validation_router.get(
    "/all",
    status_code=status.HTTP_200_OK,
    summary="Lister tous les patients du réseau",
)
async def list_all_patients(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[dict]:
    """Retrieve all followed patients across the network."""
    service = PatientValidationService(session)
    return await service.list_all_patients(current_user)


@patient_validation_router.post(
    "/{person_id}/validate",
    response_model=PendingPatientRead,
    dependencies=[Depends(require_permission("patients.validate"))],
)
async def validate_patient(
    person_id: str,
    payload: PatientValidationRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PendingPatientRead:
    """Validate or refuse a pending patient (requires patients.validate)."""
    service = PatientValidationService(session)
    person = await service.validate_patient(
        actor=current_user,
        person_id=person_id,
        decision=payload.decision,
        refusal_reason=payload.refusal_reason,
    )
    return PendingPatientRead.model_validate(person)


@patient_validation_router.post(
    "/{person_id}/assign",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("patients.assign"))],
)
async def assign_patient_caregiver(
    person_id: str,
    payload: PatientAssignRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    """Assign patient to an approved caregiver (requires patients.assign)."""
    service = PatientValidationService(session)
    await service.assign_patient_caregiver(
        actor=current_user,
        person_id=person_id,
        caregiver_id=payload.caregiver_id,
        organization_id=payload.organization_id,
        reason=payload.reason,
    )
    return {"status": "assigned", "person_id": person_id, "caregiver_id": payload.caregiver_id}


@patient_validation_router.post(
    "/{person_id}/validate-and-assign",
    response_model=PendingPatientRead,
    dependencies=[Depends(require_permission("patients.validate"))],
)
async def validate_and_assign_patient(
    person_id: str,
    payload: PatientValidateAndAssignRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PendingPatientRead:
    """Validate or refuse a patient and assign doctor / field agent."""
    service = PatientValidationService(session)
    person = await service.validate_and_assign_patient(
        actor=current_user,
        person_id=person_id,
        decision=payload.decision,
        doctor_id=payload.doctor_id,
        field_agent_id=payload.field_agent_id,
        organization_id=payload.organization_id,
        notes=payload.notes,
    )
    return PendingPatientRead.model_validate(person)


@patient_validation_router.delete(
    "/{person_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_permission("patients.validate"))],
)
async def delete_patient_by_staff(
    person_id: str,
    payload: PatientDeleteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    """Delete / archive a patient with reason (requires patients.validate)."""
    service = PatientValidationService(session)
    await service.delete_patient_with_reason(current_user, person_id, payload.reason)
    return {"status": "deleted", "person_id": person_id, "reason": payload.reason}
