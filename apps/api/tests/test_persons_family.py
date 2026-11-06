"""Tests for Domain C: Persons, Family Links, and Multi-Account Co-parenting."""

from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from tsotsa_api.core.database import Base, get_db_session
from tsotsa_api.core.security import create_access_token
from tsotsa_api.main import create_app
from tsotsa_api.modules.identity.models import User
from tsotsa_api.modules.identity.repository import IdentityRepository


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        yield session
    await engine.dispose()


async def _make_user(session: AsyncSession, name: str, role: str) -> tuple[User, dict[str, str]]:
    repo = IdentityRepository(session)
    user = await repo.create_user(display_name=name)
    await repo.assign_role(user.id, role)
    await session.commit()
    token = create_access_token(user.id, claims={"roles": [role]})
    return user, {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_persons_family_links_and_co_parenting(db_session: AsyncSession) -> None:
    """Verify family isolation, co-parenting link sharing, and impossibility of person login."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    parent_a, headers_a = await _make_user(db_session, "Maman Awa", "user")
    parent_b, headers_b = await _make_user(db_session, "Papa Ousmane", "user")
    other_user, headers_other = await _make_user(db_session, "Utilisateur Externe", "user")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Parent A creates Child A1 and Relative A2
        c_a1 = await client.post(
            "/v1/family/members",
            json={
                "first_name": "Junior",
                "birth_date": "2024-03-15",
                "sex": "M",
                "relation": "child",
            },
            headers=headers_a,
        )
        assert c_a1.status_code == 201
        child_a1 = c_a1.json()
        assert child_a1["first_name"] == "Junior"
        assert child_a1["pseudonym"].startswith("#A-")
        child_a1_id = child_a1["id"]

        c_a2 = await client.post(
            "/v1/family/members",
            json={
                "first_name": "Papi Ibrahim",
                "birth_date": "1960-01-10",
                "sex": "M",
                "relation": "relative",
            },
            headers=headers_a,
        )
        assert c_a2.status_code == 201

        # Parent B creates Child B1
        c_b1 = await client.post(
            "/v1/family/members",
            json={
                "first_name": "Amina",
                "birth_date": "2024-07-22",
                "sex": "F",
                "relation": "child",
            },
            headers=headers_b,
        )
        assert c_b1.status_code == 201

        # 2. Strict family isolation: Account A only sees A1 & A2
        list_a = await client.get("/v1/family/members", headers=headers_a)
        assert list_a.status_code == 200
        assert len(list_a.json()) == 2
        assert {m["first_name"] for m in list_a.json()} == {"Junior", "Papi Ibrahim"}

        # Account B only sees B1
        list_b = await client.get("/v1/family/members", headers=headers_b)
        assert list_b.status_code == 200
        assert len(list_b.json()) == 1
        assert list_b.json()[0]["first_name"] == "Amina"

        # External user sees empty list
        list_other = await client.get("/v1/family/members", headers=headers_other)
        assert list_other.status_code == 200
        assert list_other.json() == []

        # Cross-access forbidden: Parent B cannot access Child A1
        cross_get = await client.get(f"/v1/family/members/{child_a1_id}", headers=headers_b)
        assert cross_get.status_code == 403

        cross_put = await client.put(
            f"/v1/family/members/{child_a1_id}",
            json={"first_name": "Junior Hack"},
            headers=headers_b,
        )
        assert cross_put.status_code == 403

        cross_del = await client.delete(f"/v1/family/members/{child_a1_id}", headers=headers_b)
        assert cross_del.status_code == 403

        # 3. Co-parenting: Parent A invites Parent B to share access to Child A1
        inv_res = await client.post(
            f"/v1/family/members/{child_a1_id}/invite",
            json={"phone_or_email": "ousmane@example.com", "relation": "child"},
            headers=headers_a,
        )
        assert inv_res.status_code == 201
        token = inv_res.json()["token"]

        # Parent B accepts invitation
        accept_res = await client.post(
            "/v1/family/members/invitations/accept",
            json={"token": token},
            headers=headers_b,
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["pseudonym"] == child_a1["pseudonym"]

        # Now Parent B sees Child A1 in their family members list
        list_b_after = await client.get("/v1/family/members", headers=headers_b)
        assert list_b_after.status_code == 200
        assert len(list_b_after.json()) == 2
        assert {m["pseudonym"] for m in list_b_after.json()} == {
            child_a1["pseudonym"],
            c_b1.json()["pseudonym"],
        }

        # Parent B updates Child A1's name
        upd_res = await client.put(
            f"/v1/family/members/{child_a1_id}",
            json={"first_name": "Junior Paul"},
            headers=headers_b,
        )
        assert upd_res.status_code == 200

        # Parent A reads Child A1 and observes the update
        get_a1 = await client.get(f"/v1/family/members/{child_a1_id}", headers=headers_a)
        assert get_a1.status_code == 200
        assert get_a1.json()["first_name"] == "Junior Paul"

        # 4. Zero login possible for a followed person
        # Attempt to log in with child pseudonym
        clean_pseudo = child_a1["pseudonym"].replace("#", "").replace("-", "").lower()
        login_fake_pw = await client.post(
            "/v1/auth/email/login",
            json={"email": f"{clean_pseudo}@tsotsa-for-kids.com", "password": "Password123!"},
        )
        assert login_fake_pw.status_code == 401

        # Attempt to use person_id directly as bearer token
        impersonate = await client.get(
            "/v1/family/members",
            headers={"Authorization": f"Bearer {child_a1_id}"},
        )
        assert impersonate.status_code == 401
