"""Tests for Domain B & C: Organizations, Caregiver attachment, Strict isolation, and Regions."""

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
from tsotsa_api.modules.persons.repository import PersonsRepository


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
async def test_strict_establishment_isolation_and_caregiver_attachment(
    db_session: AsyncSession,
) -> None:
    """Verify a caregiver only sees persons of their own establishment and cross-org reads fail."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, headers_admin = await _make_user(db_session, "Admin Santé", "admin")
    caregiver_a, headers_a = await _make_user(db_session, "Dr Essomba (Yaoundé)", "caregiver")
    caregiver_b, headers_b = await _make_user(db_session, "Dr Ngono (Douala)", "caregiver")
    caregiver_pending, headers_pending = await _make_user(
        db_session, "Soignant Non Vérifié", "caregiver"
    )
    _, headers_user = await _make_user(db_session, "Parent Utilisateur", "user")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Non-admin cannot create an establishment
        forbidden_org = await client.post(
            "/v1/admin/organizations",
            json={"name": "Clinique Interdite", "type": "hopital"},
            headers=headers_user,
        )
        assert forbidden_org.status_code == 403

        # 2. Admin creates Establishment A (Yaoundé) and Establishment B (Douala)
        res_org_a = await client.post(
            "/v1/admin/organizations",
            json={
                "name": "Hôpital Gynéco-Obstétrique et Pédiatrique de Yaoundé",
                "type": "hopital",
                "address": "Ngousso, Yaoundé",
            },
            headers=headers_admin,
        )
        assert res_org_a.status_code == 201
        org_a_id = res_org_a.json()["id"]

        res_org_b = await client.post(
            "/v1/admin/organizations",
            json={
                "name": "Hôpital Laquintinie de Douala",
                "type": "hopital",
                "address": "Akwa, Douala",
            },
            headers=headers_admin,
        )
        assert res_org_b.status_code == 201
        org_b_id = res_org_b.json()["id"]

        # 3. Admin attaches Caregiver A -> Org A (approved), Caregiver B -> Org B (approved),
        #    and Caregiver Pending -> Org A (approve=False)
        att_a = await client.post(
            f"/v1/admin/organizations/{org_a_id}/caregivers",
            json={"user_id": caregiver_a.id, "licence_number": "ONMC-1042", "approve": True},
            headers=headers_admin,
        )
        assert att_a.status_code == 200
        assert att_a.json()["verification_status"] == "approved"

        att_b = await client.post(
            f"/v1/admin/organizations/{org_b_id}/caregivers",
            json={"user_id": caregiver_b.id, "licence_number": "ONMC-2089", "approve": True},
            headers=headers_admin,
        )
        assert att_b.status_code == 200

        att_p = await client.post(
            f"/v1/admin/organizations/{org_a_id}/caregivers",
            json={"user_id": caregiver_pending.id, "licence_number": "ONMC-9999", "approve": False},
            headers=headers_admin,
        )
        assert att_p.status_code == 200
        assert att_p.json()["verification_status"] == "pending"

        # 4. Caregiver A registers followed person #A-014 in Org A
        p_a_res = await client.post(
            f"/v1/organizations/{org_a_id}/persons",
            json={
                "pseudonym": "#A-014",
                "first_name": "Junior",
                "birth_date": "2024-05-12",
                "sex": "M",
            },
            headers=headers_a,
        )
        assert p_a_res.status_code == 201
        person_a_id = p_a_res.json()["id"]

        # 5. Caregiver B registers followed person #B-021 in Org B
        p_b_res = await client.post(
            f"/v1/organizations/{org_b_id}/persons",
            json={
                "pseudonym": "#B-021",
                "first_name": "Amina",
                "birth_date": "2024-08-20",
                "sex": "F",
            },
            headers=headers_b,
        )
        assert p_b_res.status_code == 201
        person_b_id = p_b_res.json()["id"]

        # 6. Caregiver A can list and read Org A's person (#A-014)
        list_a = await client.get(f"/v1/organizations/{org_a_id}/persons", headers=headers_a)
        assert list_a.status_code == 200
        assert [p["pseudonym"] for p in list_a.json()] == ["#A-014"]

        get_a = await client.get(
            f"/v1/organizations/{org_a_id}/persons/{person_a_id}", headers=headers_a
        )
        assert get_a.status_code == 200
        assert get_a.json()["pseudonym"] == "#A-014"

        # 7. ISOLATION TEST 1: Caregiver A tries to list Org B's persons -> MUST FAIL (403)
        cross_list = await client.get(f"/v1/organizations/{org_b_id}/persons", headers=headers_a)
        assert cross_list.status_code == 403

        # 8. ISOLATION TEST 2: Caregiver A tries to read Person B via Org B URL -> MUST FAIL (403)
        cross_get_b = await client.get(
            f"/v1/organizations/{org_b_id}/persons/{person_b_id}", headers=headers_a
        )
        assert cross_get_b.status_code == 403

        # 9. ISOLATION TEST 3: Caregiver A tries to read Person B via Org A URL -> MUST FAIL (403)
        cross_get_via_a = await client.get(
            f"/v1/organizations/{org_a_id}/persons/{person_b_id}", headers=headers_a
        )
        assert cross_get_via_a.status_code == 403

        # 10. ISOLATION TEST 4: Caregiver A tries to register a person in Org B -> MUST FAIL (403)
        cross_post = await client.post(
            f"/v1/organizations/{org_b_id}/persons",
            json={
                "pseudonym": "#B-099",
                "first_name": "Intrus",
                "birth_date": "2024-01-01",
                "sex": "M",
            },
            headers=headers_a,
        )
        assert cross_post.status_code == 403

        # 11. Unverified caregiver cannot read Org A's persons -> MUST FAIL (403)
        unverified_res = await client.get(
            f"/v1/organizations/{org_a_id}/persons", headers=headers_pending
        )
        assert unverified_res.status_code == 403
        assert unverified_res.json()["error"]["code"] == "CARE_GIVER_NOT_VERIFIED"

        # 12. Direct repository-level isolation check
        pers_repo = PersonsRepository(db_session)
        repo_a_persons = await pers_repo.list_persons_for_organization(org_a_id)
        assert [p.pseudonym for p in repo_a_persons] == ["#A-014"]
        assert await pers_repo.get_person_for_organization(person_b_id, org_a_id) is None
        assert await pers_repo.get_person_for_organization(person_a_id, org_b_id) is None


@pytest.mark.asyncio
async def test_regions_administration_and_user_region_preference(
    db_session: AsyncSession,
) -> None:
    """Verify administered regions CRUD, organization updates, and user preferred region."""
    app = create_app()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override_db

    _, headers_admin = await _make_user(db_session, "Admin Régions", "admin")
    _, headers_user = await _make_user(db_session, "Maman Clarisse", "user")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = await client.post(
            "/v1/admin/regions",
            json={"code": "centre", "name": "Centre", "country_code": "CMR"},
            headers=headers_admin,
        )
        assert r1.status_code == 201
        centre_id = r1.json()["id"]

        r2 = await client.post(
            "/v1/admin/regions",
            json={"code": "littoral", "name": "Littoral", "country_code": "CMR"},
            headers=headers_admin,
        )
        assert r2.status_code == 201
        littoral_id = r2.json()["id"]

        dup = await client.post(
            "/v1/admin/regions",
            json={"code": "centre", "name": "Centre Bis", "country_code": "CMR"},
            headers=headers_admin,
        )
        assert dup.status_code == 409

        upd = await client.put(
            f"/v1/admin/regions/{centre_id}",
            json={"name": "Région du Centre"},
            headers=headers_admin,
        )
        assert upd.status_code == 200
        assert upd.json()["name"] == "Région du Centre"

        all_regs = await client.get("/v1/regions")
        assert all_regs.status_code == 200
        assert len(all_regs.json()) == 2

        pref_init = await client.get("/v1/users/me/region", headers=headers_user)
        assert pref_init.status_code == 200
        assert pref_init.json()["preferred_region_id"] is None

        pref_set = await client.put(
            "/v1/users/me/region", json={"region_id": littoral_id}, headers=headers_user
        )
        assert pref_set.status_code == 200
        assert pref_set.json()["preferred_region_id"] == littoral_id
        assert pref_set.json()["region"]["code"] == "littoral"

        pref_get = await client.get("/v1/users/me/region", headers=headers_user)
        assert pref_get.status_code == 200
        assert pref_get.json()["preferred_region_id"] == littoral_id

        org_res = await client.post(
            "/v1/admin/organizations",
            json={
                "name": "CMA de Bonamoussadi",
                "type": "cma",
                "region_id": littoral_id,
                "address": "Bonamoussadi, Douala",
            },
            headers=headers_admin,
        )
        assert org_res.status_code == 201
        org_id = org_res.json()["id"]

        org_upd = await client.put(
            f"/v1/admin/organizations/{org_id}",
            json={"address": "Bonamoussadi Centre, Douala"},
            headers=headers_admin,
        )
        assert org_upd.status_code == 200
        assert org_upd.json()["address"] == "Bonamoussadi Centre, Douala"

        orgs_list = await client.get(f"/v1/organizations?region_id={littoral_id}")
        assert orgs_list.status_code == 200
        assert len(orgs_list.json()) == 1

        org_detail = await client.get(f"/v1/organizations/{org_id}")
        assert org_detail.status_code == 200
        assert org_detail.json()["type"] == "cma"
