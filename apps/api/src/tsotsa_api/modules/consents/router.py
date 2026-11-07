"""FastAPI router for Domain C (Consent texts and consent submission)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.core.errors import NotFoundError
from tsotsa_api.modules.consents.schemas import (
    ConsentGiveRequest,
    ConsentRead,
    ConsentTextCreate,
    ConsentTextRead,
)
from tsotsa_api.modules.consents.service import ConsentsService
from tsotsa_api.modules.identity import get_current_user, require_role

consents_router = APIRouter(prefix="/consents", tags=["Consents"])
admin_consents_router = APIRouter(prefix="/admin/consents", tags=["Admin - Consents"])
person_consents_router = APIRouter(prefix="/persons/{person_id}/consent", tags=["Person Consents"])


@consents_router.get("/text", response_model=ConsentTextRead)
async def get_active_consent_text(
    lang: str = Query("fr", description="Code langue"),
    db: AsyncSession = Depends(get_db_session),
) -> ConsentTextRead:
    """Retrieve the current active legal consent text to present to the user."""
    service = ConsentsService(db)
    text = await service.get_active_consent_text(language=lang)
    return ConsentTextRead.model_validate(text)


@admin_consents_router.post(
    "/text", response_model=ConsentTextRead, status_code=status.HTTP_201_CREATED
)
async def publish_consent_text(
    payload: ConsentTextCreate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ConsentTextRead:
    """Publish a new version of legal consent text (admin only)."""
    service = ConsentsService(db)
    text = await service.publish_new_consent_text(
        body=payload.body, language=payload.language, admin_user_id=admin.id
    )
    return ConsentTextRead.model_validate(text)


@person_consents_router.get("", response_model=ConsentRead)
async def get_person_consent_status(
    person_id: str,
    _: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConsentRead:
    """Get active consent details for a followed person."""
    service = ConsentsService(db)
    consent = await service.get_person_consent_status(person_id)
    if not consent:
        raise NotFoundError("Aucun consentement actif pour cette personne.")
    return consent


@person_consents_router.post("", response_model=ConsentRead, status_code=status.HTTP_201_CREATED)
async def give_consent_for_person(
    person_id: str,
    payload: ConsentGiveRequest,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConsentRead:
    """Grant explicit consent to process followed person's health data."""
    client_ip = request.client.host if request.client else None
    service = ConsentsService(db)
    return await service.give_consent(
        person_id=person_id,
        user_id=user.id,
        legal_guardian=payload.legal_guardian,
        consent_text_id=payload.consent_text_id,
        ip=client_ip,
    )


@person_consents_router.post("/withdraw", response_model=ConsentRead)
async def withdraw_consent_for_person(
    person_id: str,
    request: Request,
    user: Any = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConsentRead:
    """Withdraw health data consent for a followed person."""
    client_ip = request.client.host if request.client else None
    service = ConsentsService(db)
    return await service.withdraw_consent(
        person_id=person_id,
        user_id=user.id,
        ip=client_ip,
    )
