import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect("postgres://postgres:postgres@localhost:5432/medinexus_ai")
    rows = await conn.fetch("SELECT d.code, b.bed_type, b.total, b.occupied, b.available FROM department_beds b JOIN hospital_departments d ON d.id=b.department_id WHERE d.hospital_id='hsp-001'")
    for r in rows:
        print(dict(r))
    await conn.close()

asyncio.run(main())
