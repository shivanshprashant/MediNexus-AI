import asyncio, asyncpg, json
async def test():
    conn = await asyncpg.connect("postgresql://postgres:postgres@localhost:5432/medinexus")
    rows = await conn.fetch("SELECT id, name, age, history FROM patients ORDER BY created_at DESC LIMIT 1")
    print(dict(rows[0]) if rows else 'No rows')
    await conn.close()
asyncio.run(test())
