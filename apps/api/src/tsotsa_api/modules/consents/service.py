"""Service layer for Domain C (Consent management and legal verification)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import NotFoundError, ValidationError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.consents.models import Consent, ConsentText
from tsotsa_api.modules.consents.repository import ConsentsRepository
from tsotsa_api.modules.consents.schemas import ConsentRead

DEFAULT_CONSENT_TEXT_FR = (
    "J'accepte que les données de santé de la personne suivie (mesures anthropométriques, "
    "état nutritionnel, prises alimentaires) soient traitées et consultées par les "
    "professionnels de santé rattachés à son établissement de suivi, dans le respect "
    "de la confidentialité et de la loi camerounaise n° 2024/017 sur la protection des données "
    "à caractère personnel."
)


class ConsentsService:
    """Orchestrates health data consent granting, withdrawal, and verification."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ConsentsRepository(session)
        self.audit = AuditService(session)

    async def ensure_default_consent_text(self, language: str = "fr") -> ConsentText:
        text = await self.repo.get_active_consent_text(language=language)
        if text:
            return text
        return await self.repo.create_consent_text(
            body=DEFAULT_CONSENT_TEXT_FR, language=language, version=1
        )

    async def get_active_consent_text(self, language: str = "fr") -> ConsentText:
        return await self.ensure_default_consent_text(language=language)

    async def publish_new_consent_text(
        self, body: str, language: str = "fr", admin_user_id: str | None = None
    ) -> ConsentText:
        current = await self.repo.get_active_consent_text(language=language)
        next_ver = (current.version + 1) if current else 1
        new_text = await self.repo.create_consent_text(
            body=body, language=language, version=next_ver
        )
        await self.audit.log(
            action="create",
            entity="consent_text",
            entity_id=new_text.id,
            actor_user_id=admin_user_id,
            details={"version": new_text.version, "language": language},
        )
        return new_text

    async def give_consent(
        self,
        person_id: str,
        user_id: str,
        legal_guardian: bool = True,
        consent_text_id: str | None = None,
        ip: str | None = None,
    ) -> ConsentRead:
        if not consent_text_id:
            active_text = await self.ensure_default_consent_text()
            ct_id = active_text.id
        else:
            txt = await self.repo.get_consent_text_by_id(consent_text_id)
            if not txt:
                raise ValidationError("Texte de consentement spécifié introuvable.")
            ct_id = txt.id

        consent = await self.repo.create_consent(
            person_id=person_id,
            consent_text_id=ct_id,
            user_id=user_id,
            legal_guardian=legal_guardian,
        )
        await self.audit.log(
            action="consent_granted",
            entity="consent",
            entity_id=consent.id,
            actor_user_id=user_id,
            ip=ip,
            details={"person_id": person_id, "legal_guardian": legal_guardian},
        )
        return self._to_read(consent)

    async def withdraw_consent(
        self, person_id: str, user_id: str, ip: str | None = None
    ) -> ConsentRead:
        active = await self.repo.get_active_consent(person_id)
        if not active:
            raise NotFoundError("Aucun consentement actif à retirer pour cette personne.")

        withdrawn = await self.repo.withdraw_consent(active.id)
        assert withdrawn is not None
        await self.audit.log(
            action="consent_withdrawn",
            entity="consent",
            entity_id=withdrawn.id,
            actor_user_id=user_id,
            ip=ip,
            details={"person_id": person_id},
        )
        return self._to_read(withdrawn)

    async def has_active_consent(self, person_id: str) -> bool:
        active = await self.repo.get_active_consent(person_id)
        return active is not None and active.withdrawn_at is None

    async def get_person_consent_status(self, person_id: str) -> ConsentRead | None:
        active = await self.repo.get_active_consent(person_id)
        if not active:
            return None
        return self._to_read(active)

    def _to_read(self, consent: Consent) -> ConsentRead:
        return ConsentRead(
            id=consent.id,
            person_id=consent.person_id,
            consent_text_id=consent.consent_text_id,
            given_by_user_id=consent.given_by_user_id,
            legal_guardian=consent.legal_guardian,
            given_at=consent.given_at,
            withdrawn_at=consent.withdrawn_at,
            is_active=(consent.withdrawn_at is None),
        )
