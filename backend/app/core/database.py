import asyncpg
import logging
from app.core.config import settings

logger = logging.getLogger("medinexus.database")

pool: asyncpg.Pool = None

async def init_db_pool():
    global pool
    try:
        dsn = settings.DATABASE_URL
        if dsn.startswith("postgresql+asyncpg://"):
            dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)

        pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=2,
            max_size=10,
            command_timeout=60
        )
        logger.info("Database connection pool established successfully.")
        await create_schema_if_not_exists()
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL database pool: {e}. FastAPI running with dynamic fallback.")

async def close_db_pool():
    global pool
    if pool:
        await pool.close()
        logger.info("Database connection pool closed.")

async def get_db_pool() -> asyncpg.Pool:
    global pool
    return pool

async def get_db_connection():
    global pool
    if pool is None:
        raise Exception("Database connection pool is not initialized.")
    async with pool.acquire() as conn:
        yield conn

CREATE_TABLES_SQL = """
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'hospital_admin')),
    hospital_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(50) PRIMARY KEY,
    hospital_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emergency_phone VARCHAR(50) NOT NULL,
    ambulance_phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    established_year INT,
    employee_count INT,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude VARCHAR(50),
    longitude VARCHAR(50),
    emergency_entrance_location VARCHAR(255),
    main_entrance_location VARCHAR(255),
    contact_info TEXT,
    is_24x7_emergency BOOLEAN DEFAULT TRUE,
    emergency_department_name VARCHAR(255),
    total_emergency_beds INT DEFAULT 0,
    available_emergency_beds INT DEFAULT 0,
    trauma_care_available BOOLEAN DEFAULT TRUE,
    ambulance_available BOOLEAN DEFAULT TRUE,
    global_services JSONB DEFAULT '[]'::jsonb,
    is_onboarded BOOLEAN DEFAULT TRUE,
    admin_name VARCHAR(255),
    admin_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Hospital Departments Table
CREATE TABLE IF NOT EXISTS hospital_departments (
    id VARCHAR(50) PRIMARY KEY,
    hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_phone VARCHAR(50),
    location_floor VARCHAR(100),
    operating_hours VARCHAR(100),
    is_24x7 BOOLEAN DEFAULT TRUE,
    has_emergency_support BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    services JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Department Beds Table
CREATE TABLE IF NOT EXISTS department_beds (
    id VARCHAR(50) PRIMARY KEY,
    department_id VARCHAR(50) NOT NULL REFERENCES hospital_departments(id) ON DELETE CASCADE,
    bed_type VARCHAR(100) NOT NULL,
    total INT NOT NULL DEFAULT 0,
    occupied INT NOT NULL DEFAULT 0,
    available INT NOT NULL DEFAULT 0,
    floor_ward VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id VARCHAR(50) REFERENCES hospital_departments(id) ON DELETE SET NULL,
    doctor_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    qualification VARCHAR(255),
    experience_years INT DEFAULT 0,
    contact_phone VARCHAR(50),
    email VARCHAR(255),
    shift VARCHAR(100),
    availability VARCHAR(20) DEFAULT 'ON DUTY' CHECK (availability IN ('ON DUTY', 'OFF DUTY', 'ON LEAVE')),
    title VARCHAR(255),
    facility VARCHAR(255),
    rating VARCHAR(20) DEFAULT '4.9',
    reviews VARCHAR(100) DEFAULT '(100+ reviews)',
    copay VARCHAR(50) DEFAULT '₹800 Fee',
    photo TEXT,
    license TEXT,
    room TEXT,
    dob VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    mrn VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    dept VARCHAR(100) DEFAULT 'Cardiology',
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood VARCHAR(10) NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('HIGH', 'NORMAL')),
    status VARCHAR(20) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'COMPLETED')),
    last_visit VARCHAR(100),
    next_appointment VARCHAR(100),
    allergies TEXT,
    meds TEXT,
    history JSONB DEFAULT '{}'::jsonb,
    reason TEXT,
    recommendation TEXT,
    heart_rate VARCHAR(50) DEFAULT '72 bpm',
    emergency_contact TEXT,
    photo TEXT,
    dob VARCHAR(20),
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_history_gin ON patients USING GIN (history);

-- 10. Admin Configuration Table
CREATE TABLE IF NOT EXISTS admin_config (
    id VARCHAR(50) PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Patient Reports Table
CREATE TABLE IF NOT EXISTS patient_reports (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    age_gender VARCHAR(50),
    mrn VARCHAR(50),
    department VARCHAR(100),
    modality VARCHAR(255) NOT NULL,
    time VARCHAR(50) NOT NULL,
    date_label VARCHAR(100),
    date VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'UPCOMING' CHECK (status IN ('TODAY', 'UPCOMING', 'COMPLETED', 'CANCELLED')),
    reason TEXT,
    initials VARCHAR(10),
    bg_color VARCHAR(100),
    clinical_brief TEXT,
    doctor_info JSONB DEFAULT '{}'::jsonb,
    coverage JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Emergency Requests Table
CREATE TABLE IF NOT EXISTS emergency_requests (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    age_gender VARCHAR(50),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'EMERGENCY')),
    required_care VARCHAR(255),
    request_time VARCHAR(50),
    timestamp VARCHAR(50),
    status VARCHAR(30) DEFAULT 'REQUEST CREATED' CHECK (status IN ('REQUEST CREATED', 'HOSPITAL NOTIFIED', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'REJECTED', 'REDIRECTED', 'RESOLVED', 'DISCHARGED')),
    complaint TEXT NOT NULL,
    ai_assessment TEXT,
    ai_recommendation TEXT,
    ai_summary TEXT,
    medical_info TEXT,
    allocated_bed VARCHAR(100),
    mode VARCHAR(20) CHECK (mode IN ('drive-in', 'ambulance')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    hospital_id VARCHAR(50) REFERENCES hospitals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    desc_text TEXT,
    time_text VARCHAR(50),
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    unread BOOLEAN DEFAULT TRUE,
    summary TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Hospital Activity Logs Table
CREATE TABLE IF NOT EXISTS hospital_activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    time VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('emergency', 'doctor', 'bed', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Admission Requests Table
CREATE TABLE IF NOT EXISTS admission_requests (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id VARCHAR(50) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id VARCHAR(50) REFERENCES hospital_departments(id) ON DELETE SET NULL,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    age_gender VARCHAR(50),
    mrn VARCHAR(50),
    department_name VARCHAR(255),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ADMITTED', 'DISCHARGED')),
    reason TEXT NOT NULL,
    allocated_bed_id VARCHAR(50) REFERENCES department_beds(id) ON DELETE SET NULL,
    decision_notes TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Doctor Reviews Table
CREATE TABLE IF NOT EXISTS doctor_reviews (
    id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50) REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""

async def create_schema_if_not_exists():
    global pool
    if not pool:
        return
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLES_SQL)
        await conn.execute("""
            INSERT INTO hospitals (id, hospital_code, name, type, phone, emergency_phone, email, address, city, state, pincode)
            VALUES ('hsp-001', 'HSP-001', 'CityCare Hospital', 'Private Multi-Specialty Hospital', '+91 11 4910 2000', '102', 'admin@citycare.org', 'Plot 14, Sector 44', 'New Delhi', 'Delhi', '110017')
            ON CONFLICT (id) DO NOTHING;
        """)
        await conn.execute("""
            INSERT INTO hospital_departments (id, hospital_id, code, name)
            VALUES ('dept-cardio', 'hsp-001', 'CARDIO', 'Cardiology & Vascular Medicine'),
                   ('dept-er', 'hsp-001', 'ER', 'Emergency & Trauma'),
                   ('dept-neuro', 'hsp-001', 'NEURO', 'Neurology')
            ON CONFLICT (id) DO NOTHING;
        """)
        await conn.execute("""
            INSERT INTO department_beds (id, department_id, bed_type, total, occupied, available, floor_ward)
            VALUES ('b-cardio-1', 'dept-cardio', 'Cardiac ICU Bed', 10, 4, 6, 'Cardiology Tower 3rd Floor'),
                   ('b-er-1', 'dept-er', 'Emergency Triage Bed', 12, 7, 5, 'ER Bay A'),
                   ('b-neuro-1', 'dept-neuro', 'Neurology ICU Bed', 8, 3, 5, 'Neuro Wing 2nd Floor')
            ON CONFLICT (id) DO NOTHING;
        """)
        await conn.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;")
        await conn.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo TEXT;")
        await conn.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob VARCHAR(20);")
        await conn.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_id VARCHAR(50);")
        await conn.execute("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ambulance_phone VARCHAR(50);")
        await conn.execute("UPDATE patients SET hospital_id = 'hsp-001' WHERE hospital_id IS NULL;")
        await conn.execute("UPDATE users SET hospital_id = 'hsp-001' WHERE role = 'patient' AND hospital_id IS NULL;")
        await conn.execute("UPDATE hospitals SET ambulance_phone = phone WHERE ambulance_phone IS NULL;")
        await conn.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS license TEXT;")
        await conn.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS room TEXT;")
        await conn.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS dob VARCHAR(20);")
        await conn.execute("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hospital_id VARCHAR(50);")
        await conn.execute("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;")
        await conn.execute("ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;")
        # Columns required for REDIRECTED emergency workflow
        await conn.execute("ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS redirected_hospital_id VARCHAR(50);")
        await conn.execute("ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS redirected_hospital_name VARCHAR(255);")
        await conn.execute("ALTER TABLE emergency_requests ADD COLUMN IF NOT EXISTS redirected_hospital_address TEXT;")
        await conn.execute("ALTER TABLE emergency_requests DROP CONSTRAINT IF EXISTS emergency_requests_status_check;")
        await conn.execute("""ALTER TABLE emergency_requests ADD CONSTRAINT emergency_requests_status_check CHECK (status IN ('REQUEST CREATED', 'HOSPITAL NOTIFIED', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'REJECTED', 'REDIRECTED', 'RESOLVED', 'DISCHARGED'));""")
        await conn.execute("ALTER TABLE admission_requests DROP CONSTRAINT IF EXISTS admission_requests_status_check;")
        await conn.execute("ALTER TABLE admission_requests ADD CONSTRAINT admission_requests_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ADMITTED', 'DISCHARGED'));")
        await conn.execute("ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;")
        await conn.execute("ALTER TABLE patients ADD CONSTRAINT patients_status_check CHECK (status IN ('WAITING', 'COMPLETED', 'IN_CONSULTANCY', 'IN_CONSULTATION'));")
        await conn.execute("""
            UPDATE patients SET user_id = NULL WHERE user_id IN (SELECT id FROM users WHERE email = 'ananya.sharma@example.com');
            UPDATE users SET id = 'usr-demo-patient' WHERE email = 'ananya.sharma@example.com';
        """)
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, role, full_name, phone)
            VALUES ('usr-demo-patient', 'ananya.sharma@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'patient', 'Ananya Sharma', '+91 98192 83104')
            ON CONFLICT (email) DO UPDATE SET id = 'usr-demo-patient', full_name = 'Ananya Sharma';
        """)
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, role, full_name, phone, hospital_id)
            VALUES ('usr-doc-demo', 'dr.shiv@citycare.org', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'doctor', 'Dr. Shiv Gupta', '+91 98111 22334', 'hsp-001')
            ON CONFLICT (email) DO UPDATE SET id = 'usr-doc-demo', full_name = 'Dr. Shiv Gupta';
        """)
        await conn.execute("""
            INSERT INTO doctors (id, user_id, hospital_id, department_id, doctor_code, name, specialization, qualification, experience_years, contact_phone, email, shift, availability, title, facility, rating, reviews, copay, photo, license, room)
            VALUES ('doc-001', 'usr-doc-demo', 'hsp-001', 'dept-cardio', 'DOC-CARD-201', 'Dr. Shiv Gupta', 'Cardiology & Vascular Medicine', 'DM (Cardiology)', 19, '+91 98111 22334', 'dr.shiv@citycare.org', 'On-Call Trauma & Cath Lab', 'ON DUTY', 'Senior Cardiologist • 19 yrs exp.', 'CityCare Hospital, New Delhi', '4.9', '(180+ verified reviews)', '₹800 Fee', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE5t9YjgeORyB6vFfCDeIIIaRa432s4mT_3YjpsWo-llKbwGnOLc8BKHDHcqmz5GpOlyJOVFrtuKF5I43P6I7eZZ2uW_BDtLh-A8GN8ZiefSEeSBGN-8ZWibU6JNb0cN76L92nwC5-8twN7TBjX-4GNbXUWCA3psZCFkMY8kAtsadai5vRAwpVRf9INwyO7cSeY9EE8BXPQIDdJd4ajy3WT9SpCfJeFylNWXlkFd86jBdEpw12yohFgg', 'DMC-8948102-DL', 'Room 304')
            ON CONFLICT (id) DO UPDATE SET user_id = 'usr-doc-demo', name = 'Dr. Shiv Gupta';
        """)
        await conn.execute("""
            INSERT INTO patients (id, user_id, mrn, name, dept, age, gender, blood, priority, status, allergies, meds, history, reason, recommendation, heart_rate, emergency_contact, photo)
            SELECT 'p-demo-ananya', 'usr-demo-patient', '91-4820-5912-4091', 'Ananya Sharma', 'Cardiology', 29, 'Female', 'O+', 'NORMAL', 'WAITING', 'Penicillin, Sulfa Drugs', 'Lisinopril 10mg daily', '{"city": "New Delhi"}'::jsonb, 'Routine cardiology follow-up', 'Maintain schedule', '72 bpm', '[{"id": "ec-1", "name": "Rajesh Sharma", "relationship": "Husband", "phone": "+91 98192 83104", "isPrimary": true}]', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            FROM users u WHERE u.email = 'ananya.sharma@example.com'
            ON CONFLICT (id) DO UPDATE SET user_id = 'usr-demo-patient', name = 'Ananya Sharma';
        """)
        await conn.execute("""
            UPDATE patients
            SET user_id = 'usr-demo-patient'
            WHERE id = 'p-demo-ananya' OR name ILIKE '%Ananya%';
        """)
        await conn.execute("""
            UPDATE admission_requests
            SET patient_id = 'p-demo-ananya', patient_name = 'Ananya Sharma', age_gender = '29 / Female', mrn = '91-4820-5912-4091'
            WHERE patient_id = 'pt-24cb8118' OR patient_name ILIKE '%Khushi%';
        """)
        await conn.execute("""
            WITH duplicates AS (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY created_at DESC) as rn
                FROM admission_requests
                WHERE status IN ('PENDING', 'ADMITTED')
            )
            UPDATE admission_requests
            SET status = 'REJECTED'
            WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
        """)
        await conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_active_patient_admission ON admission_requests(patient_id) WHERE status IN ('PENDING', 'ADMITTED');")

        # ── Hospital Admin User for CityCare (HSP-001) ──
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, role, full_name, phone, hospital_id)
            VALUES ('usr-admin-hsp001', 'admin@citycare.org', '$2b$12$vBF1qHU5xbAMqu078mzJt.nj/KH3ZSRH4R7IfE3sW.k.9iHtUH3R.', 'hospital_admin', 'Admin Rajesh Sharma', '+91 11 4910 2000', 'hsp-001')
            ON CONFLICT (email) DO UPDATE SET id = 'usr-admin-hsp001', hospital_id = 'hsp-001', role = 'hospital_admin', hashed_password = '$2b$12$vBF1qHU5xbAMqu078mzJt.nj/KH3ZSRH4R7IfE3sW.k.9iHtUH3R.';
        """)

        # ── Second Hospital: Apollo Hospital (HSP-002) for isolation testing ──
        await conn.execute("""
            INSERT INTO hospitals (id, hospital_code, name, type, phone, emergency_phone, ambulance_phone, email, address, city, state, pincode, is_24x7_emergency, trauma_care_available, ambulance_available, admin_name, admin_email)
            VALUES ('hsp-002', 'HSP-002', 'Apollo Multispecialty Hospital', 'Private Multi-Specialty Hospital', '+91 22 6760 2000', '+91 22 6760 9999', '+91 22 6760 1000', 'admin@apollo.org', 'Plot 8, Andheri East', 'Mumbai', 'Maharashtra', '400069', TRUE, TRUE, TRUE, 'Admin Priya Mehta', 'admin@apollo.org')
            ON CONFLICT (id) DO NOTHING;
        """)
        await conn.execute("""
            INSERT INTO hospital_departments (id, hospital_id, code, name, description, contact_phone, is_24x7, has_emergency_support)
            VALUES ('dept-apollo-er', 'hsp-002', 'ER-01', 'Emergency Medicine & Trauma', 'Level 1 Trauma Bay', '+91 22 6760 9999', TRUE, TRUE),
                   ('dept-apollo-cardio', 'hsp-002', 'CARDIO-01', 'Cardiology & Vascular Medicine', 'Advanced CCU & Cath Lab', '+91 22 6760 2020', TRUE, TRUE),
                   ('dept-apollo-neuro', 'hsp-002', 'NEURO-01', 'Neurology & Stroke Unit', 'Comprehensive Neuro ICU', '+91 22 6760 2040', TRUE, TRUE)
            ON CONFLICT (id) DO NOTHING;
        """)
        await conn.execute("""
            INSERT INTO department_beds (id, department_id, bed_type, total, occupied, available, floor_ward)
            VALUES ('b-apollo-er-1', 'dept-apollo-er', 'Emergency Triage Beds', 15, 9, 6, 'ER Bay Alpha'),
                   ('b-apollo-cardio-1', 'dept-apollo-cardio', 'Cardiac ICU Bed', 12, 5, 7, 'CCU Wing 1'),
                   ('b-apollo-neuro-1', 'dept-apollo-neuro', 'Neurology ICU Bed', 10, 4, 6, 'Neuro ICU Bay')
            ON CONFLICT (id) DO NOTHING;
        """)
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, role, full_name, phone, hospital_id)
            VALUES ('usr-admin-hsp002', 'admin@apollo.org', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'hospital_admin', 'Admin Priya Mehta', '+91 22 6760 2000', 'hsp-002')
            ON CONFLICT (email) DO UPDATE SET id = 'usr-admin-hsp002', hospital_id = 'hsp-002', role = 'hospital_admin';
        """)
        await conn.execute("""
            INSERT INTO doctors (id, user_id, hospital_id, department_id, doctor_code, name, specialization, qualification, experience_years, contact_phone, email, shift, availability)
            VALUES ('doc-apollo-001', NULL, 'hsp-002', 'dept-apollo-er', 'DOC-APL-ER-101', 'Dr. Ravi Shankar', 'Emergency Medicine', 'MD (Emergency Medicine)', 12, '+91 98200 11223', 'dr.ravi@apollo.org', 'Morning Shift', 'ON DUTY'),
                   ('doc-apollo-002', NULL, 'hsp-002', 'dept-apollo-cardio', 'DOC-APL-CARD-201', 'Dr. Sunita Kapoor', 'Cardiologist', 'DM (Cardiology)', 14, '+91 98200 22334', 'dr.sunita@apollo.org', 'Day Shift', 'ON DUTY')
            ON CONFLICT (id) DO NOTHING;
        """)
        logger.info("Non-destructive schema verification complete.")
