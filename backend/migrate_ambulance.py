import asyncio
import asyncpg
from app.core.config import settings

async def migrate():
    dsn = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
    pool = await asyncpg.create_pool(dsn=dsn)
    async with pool.acquire() as conn:
        await conn.execute("""
            ALTER TABLE emergency_requests 
            ADD COLUMN IF NOT EXISTS ambulance_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS ambulance_type VARCHAR(50) DEFAULT 'ALS';
        """)
        # Also let's create a dedicated hospital_ambulances table for hospital-managed ambulance fleets
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS hospital_ambulances (
                id VARCHAR(100) PRIMARY KEY,
                hospital_id VARCHAR(100) REFERENCES hospitals(id) ON DELETE CASCADE,
                ambulance_number VARCHAR(100) NOT NULL,
                ambulance_type VARCHAR(50) NOT NULL DEFAULT 'ALS (Advanced Life Support)',
                driver_name VARCHAR(100) NOT NULL,
                driver_phone VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
                current_location VARCHAR(200) DEFAULT 'Hospital Bay 1',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # Seed sample ambulances for HSP-001 and HSP-002 if none exist
        hsp1_count = await conn.fetchval("SELECT count(*) FROM hospital_ambulances WHERE hospital_id = 'hsp-001'")
        if hsp1_count == 0:
            await conn.execute("""
                INSERT INTO hospital_ambulances (id, hospital_id, ambulance_number, ambulance_type, driver_name, driver_phone, status, current_location)
                VALUES 
                ('amb-001', 'hsp-001', 'DL-01-AMB-402', 'ALS (Advanced Life Support)', 'Rajesh Kumar', '+91 83039 36384', 'AVAILABLE', 'ER Ambulance Bay 1'),
                ('amb-002', 'hsp-001', 'DL-01-AMB-108', 'BLS (Basic Life Support)', 'Vikram Singh', '+91 98765 43210', 'AVAILABLE', 'Trauma Centre Gate 2'),
                ('amb-003', 'hsp-001', 'DL-01-AMB-911', 'Critical Care Mobile ICU', 'Anil Verma', '+91 98112 34567', 'AVAILABLE', 'Cardiac Wing Bay');
            """)

        hsp2_count = await conn.fetchval("SELECT count(*) FROM hospital_ambulances WHERE hospital_id = 'hsp-002'")
        if hsp2_count == 0:
            await conn.execute("""
                INSERT INTO hospital_ambulances (id, hospital_id, ambulance_number, ambulance_type, driver_name, driver_phone, status, current_location)
                VALUES 
                ('amb-101', 'hsp-002', 'DL-02-APO-501', 'ALS (Advanced Life Support)', 'Suresh Yadav', '+91 99887 76655', 'AVAILABLE', 'Apollo ER Bay North'),
                ('amb-102', 'hsp-002', 'DL-02-APO-502', 'BLS (Basic Life Support)', 'Manoj Sharma', '+91 98711 22334', 'AVAILABLE', 'Apollo West Gate');
            """)

        print("Migration and ambulance fleet seeding completed successfully!")
    await pool.close()

if __name__ == '__main__':
    asyncio.run(migrate())
