import asyncio
import asyncpg

async def check_and_create():
    conn = await asyncpg.connect("postgresql://postgres:Kunjanpost@localhost:5432/postgres")
    dbs = await conn.fetch("SELECT datname FROM pg_database")
    db_names = [r["datname"] for r in dbs]
    print("Existing databases:", db_names)
    if "medinexus_ai" not in db_names:
        print("Creating medinexus_ai database...")
        await conn.execute("CREATE DATABASE medinexus_ai")
        print("medinexus_ai created successfully.")
    else:
        print("medinexus_ai database already exists.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_and_create())
