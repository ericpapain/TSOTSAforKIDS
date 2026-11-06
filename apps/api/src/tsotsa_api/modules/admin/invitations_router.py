"""Public routes for invitation verification and acceptance."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.modules.admin.schemas import InvitationAcceptRequest, InvitationVerifyResponse
from tsotsa_api.modules.admin.service import AdminService
from tsotsa_api.modules.identity.schemas import TokenResponse

invitations_public_router = APIRouter(
    prefix="/auth/invitations",
    tags=["Authentification - Invitations"],
)


@invitations_public_router.get("/verify", response_model=InvitationVerifyResponse)
async def verify_invitation(
    token: Annotated[str, Query(description="Jeton d'invitation brut")],
    db: AsyncSession = Depends(get_db_session),
) -> InvitationVerifyResponse:
    srv = AdminService(db)
    return await srv.verify_invitation(token)


@invitations_public_router.post("/accept", response_model=TokenResponse)
async def accept_invitation(
    payload: InvitationAcceptRequest,
    db: AsyncSession = Depends(get_db_session),
) -> TokenResponse:
    srv = AdminService(db)
    _, tokens = await srv.accept_invitation(payload)
    await db.commit()
    return tokens

