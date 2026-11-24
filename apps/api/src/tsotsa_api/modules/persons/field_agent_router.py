"""Router for field agent family enrollments and operations."""

from __future__ import annotations

import re
from datetime import UTC, date, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.core.security import hash_password
from tsotsa_api.modules.consents.models import Consent
from tsotsa_api.modules.consents.service import ConsentsService
from tsotsa_api.modules.identity.dependencies import get_current_user, require_role
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository
from tsotsa_api.modules.persons.models import (
    Person,
    PersonCare,
    PersonLink,
)
from tsotsa_api.modules.persons.repository import PersonsRepository

field_agent_router = APIRouter(prefix="/field-agent", tags=["Field Agent Operations"])


class ChildEnrollmentItem(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=120)
    birth_date: date
    sex: Literal["M", "F"]
    weight_kg: float | None = Field(default=None, ge=0.3, le=60.0)
    height_cm: float | None = Field(default=None, ge=20.0, le=160.0)
    muac_mm: int | None = Field(default=None, ge=40, le=350)
    edema: bool = False


class FamilyEnrollmentRequest(BaseModel):
    parent_first_name: str = Field(..., min_length=2, max_length=100)
    parent_last_name: str = Field(..., min_length=2, max_length=100)
    parent_email: EmailStr | None = None
    parent_phone: str = Field(..., min_length=6, max_length=30)
    parent_password: str = Field(default="Tsotsa2026!Famille", min_length=8, max_length=72)
    region_id: str | None = None
    locality: str | None = None
    children: list[ChildEnrollmentItem] = Field(..., min_length=1)


class ChildUpdateRequest(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=120)
    birth_date: date
    sex: Literal["M", "F"]


class EnrolledChildRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pseudonym: str
    first_name: str
    birth_date: date
    sex: str
    status: str
    created_at: datetime
    parent_name: str | None = None
    parent_email: str | None = None
    parent_phone: str | None = None
    assigned_doctor_name: str | None = None


@field_agent_router.post(
    "/enroll-family",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("field_agent"))],
)
async def enroll_family_from_field(
    payload: FamilyEnrollmentRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, object]:
    """Enroll a family with parent account and children dossiers."""
    ident_repo = IdentityRepository(session)
    person_repo = PersonsRepository(session)

    # 1. Resolve or create parent user account
    clean_phone = re.sub(r"[\s\-\.\(\)]", "", payload.parent_phone.strip())
    clean_email = payload.parent_email.lower().strip() if payload.parent_email else None
    if not clean_email:
        clean_email = (
            f"famille.{clean_phone[-6:]}.{int(datetime.now().timestamp())}@tsotsa-for-kids.com"
        )

    resolved_region = await ident_repo.resolve_region_id(payload.region_id)
    parent_user = None

    # Check if parent identity already exists
    if clean_email:
        existing_ident = await ident_repo.get_identity_by_email(clean_email)
        if existing_ident:
            parent_user = await ident_repo.get_user_by_id(existing_ident.user_id)

    if not parent_user:
        parent_user = await ident_repo.create_user(
            display_name=f"{payload.parent_first_name} {payload.parent_last_name}".strip(),
            first_name=payload.parent_first_name.strip(),
            last_name=payload.parent_last_name.strip(),
            preferred_region_id=resolved_region,
            locality=payload.locality.strip() if payload.locality else None,
            status="active",
        )
        await ident_repo.create_identity(
            user_id=parent_user.id,
            provider="email",
            provider_subject=clean_email,
            email=clean_email,
            phone_e164=clean_phone,
            password_hash=hash_password(payload.parent_password),
            email_verified=True,
        )
        await ident_repo.assign_role(parent_user.id, "parent")

    # 2. Create each child dossier
    consents_svc = ConsentsService(session)
    consent_text = await consents_svc.ensure_default_consent_text()
    created_children = []
    for c in payload.children:
        pseudo = await person_repo.generate_next_pseudonym()
        child = Person(
            first_name=c.first_name.strip(),
            birth_date=c.birth_date,
            sex=c.sex,
            region_id=resolved_region,
            pseudonym=pseudo,
            status="pending",
            created_by=current_user.id,
            assigned_field_agent_id=current_user.id,
        )
        session.add(child)
        await session.flush()

        # Link child to parent
        link = PersonLink(
            person_id=child.id,
            user_id=parent_user.id,
            relation="child",
            is_primary=True,
        )
        session.add(link)

        # Initial legal consent
        consent = Consent(
            person_id=child.id,
            consent_text_id=consent_text.id,
            given_by_user_id=parent_user.id,
            legal_guardian=True,
            given_at=datetime.now(UTC),
        )
        session.add(consent)
        created_children.append(child.id)

    await session.commit()

    return {
        "status": "enrolled",
        "parent_user_id": parent_user.id,
        "parent_email": clean_email,
        "children_count": len(created_children),
        "children_ids": created_children,
    }


@field_agent_router.get(
    "/families",
    response_model=list[EnrolledChildRead],
    dependencies=[Depends(require_role("field_agent"))],
)
async def list_enrolled_families(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[EnrolledChildRead]:
    """List all children enrolled or monitored by this field agent."""
    stmt = (
        select(Person)
        .where(
            (Person.created_by == current_user.id)
            | (Person.assigned_field_agent_id == current_user.id)
        )
        .where(Person.deleted_at.is_(None))
        .order_by(Person.created_at.desc())
    )
    res = await session.execute(stmt)
    persons = list(res.scalars().all())
    if not persons:
        return []

    person_ids = [p.id for p in persons]

    # Resolve parent info via PersonLink -> User
    link_stmt = (
        select(PersonLink, User)
        .join(User, PersonLink.user_id == User.id)
        .where(PersonLink.person_id.in_(person_ids))
    )
    link_res = await session.execute(link_stmt)
    parents_map: dict[str, tuple[str, str | None, str | None]] = {}
    for link, u in link_res.all():
        parents_map[link.person_id] = (
            u.display_name or f"{u.first_name} {u.last_name}".strip(),
            getattr(u, "email", None),
            getattr(u, "phone", None),
        )

    # Resolve attending doctors via PersonCare
    care_stmt = (
        select(PersonCare, User)
        .join(User, PersonCare.primary_caregiver_id == User.id)
        .where(PersonCare.person_id.in_(person_ids), PersonCare.ended_at.is_(None))
    )
    care_res = await session.execute(care_stmt)
    doctor_map: dict[str, str] = {}
    for care, doc in care_res.all():
        doctor_map[care.person_id] = (
            doc.display_name or f"Dr. {doc.first_name} {doc.last_name}".strip()
        )

    result = []
    for p in persons:
        parent_info = parents_map.get(p.id, (None, None, None))
        result.append(
            EnrolledChildRead(
                id=p.id,
                pseudonym=p.pseudonym,
                first_name=p.first_name,
                birth_date=p.birth_date,
                sex=p.sex,
                status=p.status,
                created_at=p.created_at,
                parent_name=parent_info[0],
                parent_email=parent_info[1],
                parent_phone=parent_info[2],
                assigned_doctor_name=doctor_map.get(p.id),
            )
        )
    return result


@field_agent_router.put(
    "/children/{person_id}",
    response_model=EnrolledChildRead,
    dependencies=[Depends(require_role("field_agent"))],
)
async def update_child_by_agent(
    person_id: str,
    payload: ChildUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EnrolledChildRead:
    """Update child demographic information."""
    stmt = (
        select(Person)
        .where(Person.id == person_id)
        .where(
            (Person.created_by == current_user.id)
            | (Person.assigned_field_agent_id == current_user.id)
        )
        .where(Person.deleted_at.is_(None))
    )
    res = await session.execute(stmt)
    child = res.scalar_one_or_none()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enfant introuvable ou non autorisé.",
        )

    child.first_name = payload.first_name.strip()
    child.birth_date = payload.birth_date
    child.sex = payload.sex
    child.updated_at = datetime.now(UTC)
    await session.commit()

    return EnrolledChildRead(
        id=child.id,
        pseudonym=child.pseudonym,
        first_name=child.first_name,
        birth_date=child.birth_date,
        sex=child.sex,
        status=child.status,
        created_at=child.created_at,
    )


@field_agent_router.delete(
    "/children/{person_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role("field_agent"))],
)
async def delete_child_by_agent(
    person_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    """Delete / archive an enrolled child."""
    stmt = (
        select(Person)
        .where(Person.id == person_id)
        .where(
            (Person.created_by == current_user.id)
            | (Person.assigned_field_agent_id == current_user.id)
        )
        .where(Person.deleted_at.is_(None))
    )
    res = await session.execute(stmt)
    child = res.scalar_one_or_none()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enfant introuvable ou déjà supprimé.",
        )

    now = datetime.now(UTC)
    child.deleted_at = now
    child.deleted_by = current_user.id
    child.status = "archived"
    await session.commit()
    return {"status": "deleted", "person_id": person_id}
