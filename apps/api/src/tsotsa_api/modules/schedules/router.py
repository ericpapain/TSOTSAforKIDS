"""FastAPI endpoints for Domain J: Intake Schedules."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.identity import IdentityRepository, get_current_user
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.schedules.schemas import (
    IntakeScheduleCreate,
    IntakeScheduleDetail,
    IntakeScheduleUpdate,
)
from tsotsa_api.modules.schedules.service import SchedulesService

schedules_router = APIRouter(tags=["Plans de prises"])


async def _get_roles(user_id: str, db: AsyncSession) -> list[str]:
    return await IdentityRepository(db).get_user_role_codes(user_id)


@schedules_router.post(
    "/schedules",
    response_model=IntakeScheduleDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Prescrire un plan de prises",
)
async def create_schedule(
    payload: IntakeScheduleCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> IntakeScheduleDetail:
    roles = await _get_roles(user.id, db)
    service = SchedulesService(db)
    return await service.create_schedule(payload, actor_user_id=user.id, roles=roles)


@schedules_router.get(
    "/persons/{person_id}/schedules",
    response_model=list[IntakeScheduleDetail],
    summary="Lister les plans de prises d'un enfant",
)
async def list_person_schedules(
    person_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    status_filter: Annotated[str | None, Query(alias="status")] = None,
) -> list[IntakeScheduleDetail]:
    roles = await _get_roles(user.id, db)
    service = SchedulesService(db)
    return await service.list_person_schedules(
        person_id=person_id, actor_user_id=user.id, roles=roles, status=status_filter
    )


@schedules_router.get(
    "/schedules/{id}",
    response_model=IntakeScheduleDetail,
    summary="Détail d'un plan de prises",
)
async def get_schedule(
    id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> IntakeScheduleDetail:
    roles = await _get_roles(user.id, db)
    service = SchedulesService(db)
    return await service.get_schedule(schedule_id=id, actor_user_id=user.id, roles=roles)


@schedules_router.patch(
    "/schedules/{id}",
    response_model=IntakeScheduleDetail,
    summary="Modifier un plan de prises",
)
async def update_schedule(
    id: str,
    payload: IntakeScheduleUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> IntakeScheduleDetail:
    roles = await _get_roles(user.id, db)
    service = SchedulesService(db)
    return await service.update_schedule(
        schedule_id=id, payload=payload, actor_user_id=user.id, roles=roles
    )


@schedules_router.delete(
    "/schedules/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Annuler un plan de prises",
)
async def cancel_schedule(
    id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    roles = await _get_roles(user.id, db)
    service = SchedulesService(db)
    await service.cancel_schedule(schedule_id=id, actor_user_id=user.id, roles=roles)
