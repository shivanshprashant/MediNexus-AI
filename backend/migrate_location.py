import asyncio
import asyncpg
from app.core.config import settings

async def migrate_location():
    dsn = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
    pool = await asyncpg.create_pool(dsn=dsn)
    async with pool.acquire() as conn:
        await conn.execute("""
            ALTER TABLE emergency_requests 
            ADD COLUMN IF NOT EXISTS patient_location TEXT,
            ADD COLUMN IF NOT EXISTS patient_latitude DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS patient_longitude DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS maps_link TEXT;
        """)
        print("Location columns added to emergency_requests successfully!")
    await pool.close()

if __name__ == '__main__':
    asyncio.run(migrate_location())
