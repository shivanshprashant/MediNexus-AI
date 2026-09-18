import asyncio
import asyncpg
from app.core.config import settings

async def check():
    pool = await asyncpg.create_pool(dsn=settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://'))
    async with pool.acquire() as conn:
        cols = await conn.fetch('''
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('emergency_requests', 'patients', 'hospitals', 'hospital_activity_logs', 'department_beds') 
            ORDER BY table_name, ordinal_position
        ''')
        for r in cols:
            print(f"{r['table_name']}.{r['column_name']} ({r['data_type']})")
    await pool.close()

if __name__ == '__main__':
    asyncio.run(check())
