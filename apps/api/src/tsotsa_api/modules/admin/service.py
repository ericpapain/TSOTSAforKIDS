"""Admin orchestrator service connecting public module services (never repositories)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.admin.schemas import (
    AdminCaregiverListItem,
    AdminCaregiverListResponse,
    AdminCaregiverReviewRequest,
    AdminUserCreateRequest,
    AdminUserCreateResponse,
    AdminUserIdentityItem,
    AdminUserListItem,
    AdminUserListResponse,
    InvitationAcceptRequest,
    InvitationVerifyResponse,
    NotificationSettingsRead,
    NotificationSettingsUpdate,
    PlatformHealthResponse,
)
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.identity.admin_service import IdentityAdminService
from tsotsa_api.modules.identity.schemas import TokenResponse
from tsotsa_api.modules.modules_registry.service import ModulesRegistryService
from tsotsa_api.modules.notifications.service import NotificationsService
from tsotsa_api.modules.organizations.service import OrganizationsService
from tsotsa_api.modules.persons.service import PersonsService
from tsotsa_api.modules.reference_products.service import ReferenceProductService


class AdminService:
    """Central administrative orchestrator delegating to specialized public module services."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.identity_admin = IdentityAdminService(session)
        self.orgs_service = OrganizationsService(session)
        self.products_service = ReferenceProductService(session)
        self.modules_service = ModulesRegistryService(session)
        self.notif_service = NotificationsService(session)
        self.persons_service = PersonsService(session)
        self.audit_service = AuditService(session)

    async def list_users(
        self,
        role: str | None = None,
        status: str | None = None,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> AdminUserListResponse:
        users, total = await self.identity_admin.list_users(
            role=role, status=status, search=search, limit=limit, offset=offset
        )
        items: list[AdminUserListItem] = []
        for u in users:
            roles = [ur.role.code for ur in u.user_roles if ur.role]
            identities = [
                AdminUserIdentityItem(
                    provider=ident.provider,
                    email=ident.email,
                    phone=ident.phone_e164,
                )
                for ident in u.identities
            ]
            items.append(
                AdminUserListItem(
                    id=u.id,
                    display_name=u.display_name,
                    status=u.status,
                    roles=roles,
                    identities=identities,
                    preferred_region_id=u.preferred_region_id,
                    caregiver_status=u.caregiver_profile.verification_status
                    if u.caregiver_profile
                    else None,
                    caregiver_org_id=u.caregiver_profile.organization_id
                    if u.caregiver_profile
                    else None,
                    created_at=u.created_at,
                    last_login_at=u.last_login_at,
                )
            )
        return AdminUserListResponse(items=items, total=total)

    async def create_user_invitation(
        self, admin_user_id: str, payload: AdminUserCreateRequest
    ) -> AdminUserCreateResponse:
        user, inv, raw_token = await self.identity_admin.create_invited_user(
            created_by=admin_user_id,
            display_name=payload.display_name,
            role=payload.role,
            phone_or_email=payload.phone_or_email,
            organization_id=payload.organization_id,
            is_verified_caregiver=payload.is_verified_caregiver,
            licence_number=payload.licence_number,
        )
        url = f"https://app.tsotsa-for-kids.com/invitation?token={raw_token}"
        return AdminUserCreateResponse(
            user_id=user.id,
            display_name=user.display_name,
            role=payload.role,
            status=user.status,
            phone_or_email=payload.phone_or_email,
            invitation_token=raw_token,
            invitation_url=url,
            expires_at=inv.expires_at,
        )

    async def verify_invitation(self, raw_token: str) -> InvitationVerifyResponse:
        res = await self.identity_admin.verify_invitation(raw_token)
        return InvitationVerifyResponse(**res)

    async def accept_invitation(
        self, payload: InvitationAcceptRequest
    ) -> tuple[dict[str, Any], TokenResponse]:
        google_sub = f"google-sub-{payload.id_token}" if payload.id_token else None
        user, tokens = await self.identity_admin.accept_invitation(
            raw_token=payload.token,
            method=payload.method,
            email=payload.email,
            password=payload.password,
            phone=payload.phone,
            google_sub=google_sub,
            google_email=payload.email,
        )
        return {"id": user.id, "display_name": user.display_name, "status": user.status}, tokens

    async def suspend_user(
        self, user_id: str, admin_user_id: str, reason: str | None = None
    ) -> dict[str, str]:
        user = await self.identity_admin.suspend_user(
            user_id=user_id, admin_user_id=admin_user_id, reason=reason
        )
        return {"id": user.id, "status": user.status, "message": "Compte suspendu avec succès."}

    async def reactivate_user(self, user_id: str, admin_user_id: str) -> dict[str, str]:
        user = await self.identity_admin.reactivate_user(
            user_id=user_id, admin_user_id=admin_user_id
        )
        return {"id": user.id, "status": user.status, "message": "Compte réactivé avec succès."}

    async def list_caregivers(
        self,
        status: str | None = None,
        organization_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> AdminCaregiverListResponse:
        cgs, total = await self.identity_admin.list_caregivers(
            status=status, organization_id=organization_id, limit=limit, offset=offset
        )
        items: list[AdminCaregiverListItem] = []
        for cg in cgs:
            d_name = cg.user.display_name if cg.user else "Soignant"
            items.append(
                AdminCaregiverListItem(
                    user_id=cg.user_id,
                    display_name=d_name,
                    organization_id=cg.organization_id,
                    licence_number=cg.licence_number,
                    document_file=cg.document_file,
                    verification_status=cg.verification_status,
                    verification_notes=cg.verification_notes,
                    verified_by=cg.verified_by,
                    verified_at=cg.verified_at,
                    created_at=cg.created_at,
                )
            )
        return AdminCaregiverListResponse(items=items, total=total)

    async def review_caregiver(
        self, user_id: str, admin_user_id: str, payload: AdminCaregiverReviewRequest
    ) -> dict[str, Any]:
        profile = await self.identity_admin.review_caregiver(
            user_id=user_id,
            admin_user_id=admin_user_id,
            action=payload.action,
            reason=payload.reason,
            message=payload.message,
        )
        return {
            "user_id": profile.user_id,
            "verification_status": profile.verification_status,
            "verification_notes": profile.verification_notes,
        }

    async def get_notification_settings(self) -> NotificationSettingsRead:
        settings = await self.modules_service.list_settings()
        by_key = {s.key: s.value for s in settings}
        return NotificationSettingsRead(
            channels_enabled=by_key.get(
                "notification_channels",
                {"push": True, "sms": True, "email": True, "in_app": True},
            ),
            followup_delay_minutes=by_key.get("notification_rules", {}).get(
                "followup_delay_minutes", 30
            ),
            max_attempts=by_key.get("notification_rules", {}).get("max_attempts", 3),
            quiet_start=by_key.get("notification_quiet_hours", {}).get("quiet_start", "22:00"),
            quiet_end=by_key.get("notification_quiet_hours", {}).get("quiet_end", "07:00"),
            updated_at=datetime.now(UTC),
        )

    async def update_notification_settings(
        self, payload: NotificationSettingsUpdate, admin_user_id: str
    ) -> NotificationSettingsRead:
        await self.modules_service.upsert_setting(
            key="notification_channels",
            value=payload.channels_enabled,
            admin_user_id=admin_user_id,
        )
        await self.modules_service.upsert_setting(
            key="notification_rules",
            value={
                "followup_delay_minutes": payload.followup_delay_minutes,
                "max_attempts": payload.max_attempts,
            },
            admin_user_id=admin_user_id,
        )
        await self.modules_service.upsert_setting(
            key="notification_quiet_hours",
            value={"quiet_start": payload.quiet_start, "quiet_end": payload.quiet_end},
            admin_user_id=admin_user_id,
        )
        await self.audit_service.log(
            action="update_notification_settings",
            entity="app_settings",
            actor_user_id=admin_user_id,
            details=payload.model_dump(),
        )
        return await self.get_notification_settings()

    async def get_platform_health(self) -> PlatformHealthResponse:
        user_stats = await self.identity_admin.admin_repo.get_user_stats()
        notif_stats = await self.notif_service.get_stats()
        orgs = await self.orgs_service.list_organizations(only_active=False)

        return PlatformHealthResponse(
            status="healthy",
            accounts=user_stats,
            notifications={
                "total_sent": notif_stats.total_sent,
                "total_queued": notif_stats.total_queued,
                "total_delivered": notif_stats.total_delivered,
                "total_failed": notif_stats.total_failed,
                "total_cancelled": notif_stats.total_cancelled,
            },
            clinical={
                "total_organizations": len(orgs),
            },
            timestamp=datetime.now(UTC),
        )
