"""Repository layer for Domain C (Consent texts and explicit consents)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.consents.models import Consent, ConsentText


class ConsentsRepository:
    """Encapsulates database access for versioned consent texts and consents."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_active_consent_text(self, language: str = "fr") -> ConsentText | None:
        stmt = (
            select(ConsentText)
            .where(
                ConsentText.language == language.strip().lower(),
                ConsentText.is_current.is_(True),
            )
            .order_by(ConsentText.version.desc())
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_consent_text(
        self, body: str, language: str = "fr", version: int = 1
    ) -> ConsentText:
        await self.session.execute(
            update(ConsentText)
            .where(ConsentText.language == language.strip().lower())
            .values(is_current=False)
        )
        ct = ConsentText(
            version=version,
            language=language.strip().lower(),
            body=body.strip(),
            is_current=True,
            published_at=datetime.now(UTC),
        )
        self.session.add(ct)
        await self.session.flush()
        return ct

    async def get_consent_text_by_id(self, consent_text_id: str) -> ConsentText | None:
        stmt = select(ConsentText).where(ConsentText.id == consent_text_id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_consent(
        self,
        person_id: str,
        consent_text_id: str,
        user_id: str,
        legal_guardian: bool = True,
    ) -> Consent:
        # Withdraw any existing active consent before granting new one
        await self.session.execute(
            update(Consent)
            .where(Consent.person_id == person_id, Consent.withdrawn_at.is_(None))
            .values(withdrawn_at=datetime.now(UTC))
        )
        consent = Consent(
            person_id=person_id,
            consent_text_id=consent_text_id,
            given_by_user_id=user_id,
            legal_guardian=legal_guardian,
            given_at=datetime.now(UTC),
            withdrawn_at=None,
        )
        self.session.add(consent)
        await self.session.flush()
        return consent

    async def get_active_consent(self, person_id: str) -> Consent | None:
        stmt = (
            select(Consent)
            .where(Consent.person_id == person_id, Consent.withdrawn_at.is_(None))
            .order_by(desc(Consent.given_at))
            .limit(1)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def withdraw_consent(self, consent_id: str) -> Consent | None:
        stmt = select(Consent).where(Consent.id == consent_id)
        res = await self.session.execute(stmt)
        consent = res.scalar_one_or_none()
        if not consent:
            return None
        consent.withdrawn_at = datetime.now(UTC)
        await self.session.flush()
        return consent

    async def list_consents_for_person(self, person_id: str) -> list[Consent]:
        stmt = (
            select(Consent).where(Consent.person_id == person_id).order_by(desc(Consent.given_at))
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())
