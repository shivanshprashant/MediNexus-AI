import asyncio
import asyncpg
import bcrypt

async def main():
    pool = await asyncpg.create_pool("postgresql://admin:securepassword123@db:5432/medinexus")
    async with pool.acquire() as conn:
        new_hash = bcrypt.hashpw(b"adminpassword", bcrypt.gensalt()).decode()
        await conn.execute("UPDATE users SET hashed_password = $1 WHERE email = 'admin@citycare.org'", new_hash)
        print("Updated!")

asyncio.run(main())
