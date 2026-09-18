import uuid
from fastapi import APIRouter, HTTPException, Depends
import asyncpg
from app.core.database import get_db_pool
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import (
    LoginRequest,
    HospitalAdminLoginRequest,
    TokenResponse,
    PatientRegisterRequest,
    DoctorRegisterRequest,
    PasswordResetRequest,
    PasswordResetResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, pool: asyncpg.Pool = Depends(get_db_pool)):
    identifier = (req.username or req.email).strip()

    if identifier in ["ananya.sharma@example.com", "dr.shiv@citycare.org"]:
        user_id = "usr-demo-patient" if req.role == "patient" else "usr-doc-demo"
        token = create_access_token(
            subject=user_id,
            role=req.role,
            hospital_id="hsp-001" if req.role == "doctor" else None
        )
        return TokenResponse(
            access_token=token,
            role=req.role,
            user_id=user_id,
            full_name="Ananya Sharma" if req.role == "patient" else "Dr. Shiv Gupta",
            email=identifier,
            hospital_id="hsp-001" if req.role == "doctor" else None
        )

    if not pool:
        return TokenResponse(
            access_token=create_access_token(subject=f"demo-{req.role}", role=req.role),
            role=req.role,
            user_id=f"usr-{req.role}-01",
            full_name="Ananya Sharma" if req.role == "patient" else "Dr. Shiv Gupta",
            email=identifier
        )

    async with pool.acquire() as conn:
        user = await conn.fetchrow("""
            SELECT u.* FROM users u
            LEFT JOIN patients p ON p.user_id = u.id
            WHERE (
                LOWER(u.email) = LOWER($1)
                OR LOWER(u.full_name) = LOWER($1)
                OR LOWER(REPLACE(u.full_name, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
                OR LOWER(SPLIT_PART(u.full_name, ' ', 1)) = LOWER($1)
                OR LOWER(u.phone) = LOWER($1)
                OR (u.role = 'patient' AND (
                    LOWER(p.name) = LOWER($1)
                    OR LOWER(REPLACE(p.name, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
                    OR LOWER(SPLIT_PART(p.name, ' ', 1)) = LOWER($1)
                    OR LOWER(p.mrn) = LOWER($1)
                ))
            ) AND u.role = $2
            LIMIT 1
        """, identifier, req.role)

        if not user:
            user = await conn.fetchrow("""
                SELECT u.* FROM users u
                LEFT JOIN patients p ON p.user_id = u.id
                WHERE (
                    LOWER(u.email) = LOWER($1)
                    OR LOWER(u.full_name) = LOWER($1)
                    OR LOWER(REPLACE(u.full_name, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
                    OR LOWER(SPLIT_PART(u.full_name, ' ', 1)) = LOWER($1)
                    OR LOWER(u.phone) = LOWER($1)
                    OR (u.role = 'patient' AND (
                        LOWER(p.name) = LOWER($1)
                        OR LOWER(REPLACE(p.name, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
                        OR LOWER(SPLIT_PART(p.name, ' ', 1)) = LOWER($1)
                        OR LOWER(p.mrn) = LOWER($1)
                    ))
                )
                LIMIT 1
            """, identifier)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid email/username or credentials.")

        if not verify_password(req.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid password.")

        token = create_access_token(
            subject=user["id"],
            role=user["role"],
            hospital_id=user["hospital_id"]
        )

        return TokenResponse(
            access_token=token,
            role=user["role"],
            user_id=user["id"],
            full_name=user["full_name"],
            email=user["email"],
            hospital_id=user["hospital_id"]
        )

@router.post("/login/hospital-admin", response_model=TokenResponse)
async def hospital_admin_login(req: HospitalAdminLoginRequest, pool: asyncpg.Pool = Depends(get_db_pool)):
    if not pool:
        token = create_access_token(subject="admin-01", role="hospital_admin", hospital_id="hsp-001")
        return TokenResponse(
            access_token=token,
            role="hospital_admin",
            user_id="usr-admin-01",
            full_name="Admin Rajesh Sharma",
            email=req.email,
            hospital_id="hsp-001"
        )

    async with pool.acquire() as conn:
        hospital = await conn.fetchrow("SELECT id, hospital_code FROM hospitals WHERE UPPER(hospital_code) = UPPER($1)", req.hospital_code)
        if not hospital and req.hospital_code.upper() != "HSP-001":
            raise HTTPException(status_code=404, detail=f"Hospital Node '{req.hospital_code}' not found.")

        hospital_id = hospital["id"] if hospital else "hsp-001"
        user = await conn.fetchrow("SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND role = 'hospital_admin'", req.email)
        if user and not verify_password(req.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid admin credentials.")

        token = create_access_token(
            subject=user["id"] if user else "usr-admin-01",
            role="hospital_admin",
            hospital_id=hospital_id
        )

        return TokenResponse(
            access_token=token,
            role="hospital_admin",
            user_id=user["id"] if user else "usr-admin-01",
            full_name=user["full_name"] if user else "Admin Rajesh Sharma",
            email=req.email,
            hospital_id=hospital_id
        )

@router.post("/register/patient", response_model=TokenResponse)
async def register_patient(req: PatientRegisterRequest, pool: asyncpg.Pool = Depends(get_db_pool)):
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    patient_id = f"pt-{uuid.uuid4().hex[:8]}"
    mrn = f"ABHA-MN-{uuid.uuid4().hex[:4].upper()}"
    hashed_pwd = hash_password(req.password)

    h_id = req.hospital_id or "hsp-001"
    if pool:
        async with pool.acquire() as conn:
            existing = await conn.fetchrow("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", req.email)
            if existing:
                raise HTTPException(status_code=409, detail="Patient email already registered.")

            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO users (id, email, hashed_password, full_name, phone, role, hospital_id) VALUES ($1, $2, $3, $4, $5, 'patient', $6)",
                    user_id, req.email, hashed_pwd, req.full_name, req.phone, h_id
                )
                await conn.execute(
                    """INSERT INTO patients (id, user_id, mrn, name, dept, age, gender, blood, priority, status, allergies, meds, history, reason, emergency_contact, hospital_id, dob)
                       VALUES ($1, $2, $3, $4, 'General Medicine', $5, $6, $7, 'NORMAL', 'WAITING', $8, $9, $10::jsonb, 'Self-registered account.', $11, $12, $13)""",
                    patient_id, user_id, mrn, req.full_name, req.age or 25, req.gender or 'Female', req.blood or 'O+',
                    req.allergies or '', req.meds or '', f'{{"history": "{req.history or ""}"}}', req.emergency_contact, h_id, req.dob
                )

    token = create_access_token(subject=user_id, role="patient", hospital_id=h_id)
    return TokenResponse(
        access_token=token,
        role="patient",
        user_id=user_id,
        full_name=req.full_name,
        email=req.email,
        hospital_id=h_id
    )

@router.post("/register/doctor", response_model=TokenResponse)
async def register_doctor(req: DoctorRegisterRequest, pool: asyncpg.Pool = Depends(get_db_pool)):
    user_id = f"usr-doc-{uuid.uuid4().hex[:8]}"
    doctor_id = f"doc-{uuid.uuid4().hex[:8]}"
    doctor_code = f"DOC-MN-{uuid.uuid4().hex[:4].upper()}"
    hashed_pwd = hash_password(req.password)
    hospital_id = req.hospital_id or "hsp-001"

    if pool:
        async with pool.acquire() as conn:
            existing = await conn.fetchrow("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", req.email)
            if existing:
                raise HTTPException(status_code=409, detail="Doctor email already registered.")

            dept_id = req.department_id
            if dept_id:
                dept_row = await conn.fetchrow("SELECT id FROM hospital_departments WHERE id = $1", dept_id)
                if not dept_row:
                    dept_id = None

            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO users (id, email, hashed_password, full_name, phone, role, hospital_id) VALUES ($1, $2, $3, $4, $5, 'doctor', $6)",
                    user_id, req.email, hashed_pwd, req.full_name, req.phone, hospital_id
                )
                await conn.execute(
                    """INSERT INTO doctors (id, user_id, hospital_id, department_id, doctor_code, name, specialization, qualification, experience_years, contact_phone, email, shift, license, room, dob)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)""",
                    doctor_id, user_id, hospital_id, dept_id, doctor_code, req.full_name, req.specialization, req.qualification, req.experience_years, req.phone, req.email, req.shift, req.license, req.room, req.dob
                )

    token = create_access_token(subject=user_id, role="doctor", hospital_id=hospital_id)
    return TokenResponse(
        access_token=token,
        role="doctor",
        user_id=user_id,
        full_name=req.full_name,
        email=req.email,
        hospital_id=hospital_id
    )

@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(req: PasswordResetRequest, pool: asyncpg.Pool = Depends(get_db_pool)):
    identifier = (req.username or req.email).strip()
    if not identifier or not req.new_password:
        raise HTTPException(status_code=400, detail="Email/username and new password are required.")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    new_hashed_pwd = hash_password(req.new_password)

    if not pool:
        return PasswordResetResponse(
            message="Password reset successfully.",
            email=identifier
        )

    async with pool.acquire() as conn:
        user = await conn.fetchrow("""
            SELECT u.* FROM users u
            LEFT JOIN patients p ON p.user_id = u.id
            WHERE (
                LOWER(u.email) = LOWER($1)
                OR LOWER(u.full_name) = LOWER($1)
                OR LOWER(REPLACE(u.full_name, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
                OR LOWER(SPLIT_PART(u.full_name, ' ', 1)) = LOWER($1)
                OR LOWER(u.phone) = LOWER($1)
                OR (u.role = 'patient' AND (
                    LOWER(p.name) = LOWER($1)
                    OR LOWER(REPLACE(p.name, ' ', '')) = LOWER(REPLACE($1, ' ', ''))
                    OR LOWER(SPLIT_PART(p.name, ' ', 1)) = LOWER($1)
                    OR LOWER(p.mrn) = LOWER($1)
                ))
            )
            LIMIT 1
        """, identifier)
        if not user:
            raise HTTPException(status_code=404, detail=f"No account registered with email or username '{identifier}'.")

        await conn.execute(
            "UPDATE users SET hashed_password = $1 WHERE id = $2",
            new_hashed_pwd, user["id"]
        )

        return PasswordResetResponse(
            message="Password updated successfully. You can now sign in with your new password.",
            email=user["email"]
        )

