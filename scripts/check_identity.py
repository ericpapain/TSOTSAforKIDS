import asyncio
from sqlalchemy import select
from tsotsa_api.core.database import async_session_factory
from tsotsa_api.modules.identity.models import UserIdentity

async def main():
    async with async_session_factory() as s:
        stmt = select(UserIdentity).order_by(UserIdentity.created_at.desc()).limit(5)
        res = await s.execute(stmt)
        for row in res.scalars().all():
            print("ID:", row.id, "email:", row.email, "provider:", row.provider)

if __name__ == "__main__":
    asyncio.run(main())
