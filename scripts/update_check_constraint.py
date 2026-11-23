import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from tsotsa_api.core.config import get_settings

async def update():
    engine = create_async_engine(get_settings().DATABASE_URL)
    async with engine.begin() as conn:
        print("Dropping old ck_users_status...")
        await conn.execute(text("ALTER TABLE users DROP CHECK ck_users_status"))
        print("Adding updated ck_users_status...")
        await conn.execute(
            text(
                "ALTER TABLE users ADD CONSTRAINT ck_users_status "
                "CHECK (status IN ('pending', 'active', 'refused', 'suspended', 'deleted', 'invited'))"
            )
        )
    print("SUCCESS: ck_users_status updated!")

if __name__ == "__main__":
    asyncio.run(update())
