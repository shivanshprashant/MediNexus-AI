from fastapi import APIRouter, Depends, HTTPException, Header, Request
from typing import List, Optional, Any
from datetime import datetime
import asyncpg
import json
from app.core.database import get_db_pool
from app.core.security import decode_access_token
from app.schemas.patient import PatientBase, PatientUpdate
import os
import uuid

router = APIRouter(prefix="/patients", tags=["Patients"])

def format_history(val: Any) -> str:
    if val is None:
        return ""
    if isinstance(val, str):
        if val.startswith('"') and val.endswith('"') and len(val) >= 2:
            try:
                return json.loads(val)
            except Exception:
                return val
        return val
    try:
        return json.dumps(val)
    except Exception:
        return str(val)

def compute_age(dob: Optional[str], fallback_age: int) -> int:
    if not dob:
        return fallback_age
    try:
        b = datetime.strptime(dob, "%Y-%m-%d")
        t = datetime.today()
        return t.year - b.year - ((t.month, t.day) < (b.month, b.day))
    except Exception:
        return fallback_age

def get_user_id_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        if token in ["demo-fallback-token", "demo-patient", "usr-demo"]:
            return "usr-demo"
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            return payload["sub"]
    return None

DEMO_PATIENTS: List[PatientBase] = [
    PatientBase(
        id="p-demo-ananya",
        name="Ananya Sharma",
        mrn="91-4820-5912-4091",
        dept="Cardiology",
        age=29,
        gender="Female",
        blood="O+",
        priority="NORMAL",
        status="WAITING",
        lastVisit="Oct 14, 2026",
        nextAppointment="Tomorrow at 10:00 AM (OPD Suite 304)",
        allergies="Penicillin, Sulfa Drugs",
        meds="Lisinopril 10mg daily, Metoprolol Tartrate 25mg BID",
        history="City: New Delhi. Essential hypertension, mild asthma.",
        reason="Routine cardiology follow-up and prescription review.",
        recommendation="Maintain current medication schedule.",
        heartRate="72 bpm",
        phone="+91 98192 83104",
        email="ananya.sharma@example.com",
        emergency_contact=json.dumps([
            {"id": "ec-1", "name": "Rajesh Sharma", "relationship": "Husband", "phone": "+91 98192 83104", "isPrimary": True},
            {"id": "ec-2", "name": "Sunita Sharma", "relationship": "Mother", "phone": "+91 98201 44812", "isPrimary": False}
        ]),
        photo="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    )
]

async def seed_initial_patient_if_empty(conn: asyncpg.Connection):
    row = await conn.fetchrow("SELECT id FROM patients LIMIT 1")
    if not row:
        demo = DEMO_PATIENTS[0]
        await conn.execute(
            """INSERT INTO patients (id, mrn, name, dept, age, gender, blood, priority, status, allergies, meds, history, reason, recommendation, heart_rate)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15)
               ON CONFLICT (id) DO NOTHING""",
            demo.id, demo.mrn, demo.name, demo.dept, demo.age, demo.gender, demo.blood, demo.priority, demo.status,
            demo.allergies, demo.meds, json.dumps(demo.history), demo.reason, demo.recommendation, demo.heartRate
        )

@router.get("", response_model=List[PatientBase])
async def list_patients(pool: asyncpg.Pool = Depends(get_db_pool)):
    if not pool:
        return DEMO_PATIENTS

    async with pool.acquire() as conn:
        await seed_initial_patient_if_empty(conn)
        rows = await conn.fetch("SELECT * FROM patients ORDER BY created_at DESC")
        if not rows:
            return DEMO_PATIENTS
        
        results = []
        for r in rows:
            results.append(PatientBase(
                id=r["id"],
                mrn=r["mrn"],
                name=r["name"],
                dept=r["dept"] or "Cardiology",
                age=compute_age(r.get("dob"), r["age"]),
                dob=r.get("dob"),
                gender=r["gender"],
                blood=r["blood"],
                priority=r["priority"] or "NORMAL",
                status=r["status"] or "WAITING",
                lastVisit=r["last_visit"],
                nextAppointment=r["next_appointment"],
                allergies=r["allergies"] or "",
                meds=r["meds"] or "",
                history=format_history(r["history"]),
                reason=r["reason"] or "",
                recommendation=r["recommendation"] or "",
                heartRate=r["heart_rate"] or "72 bpm",
                emergency_contact=r.get("emergency_contact"),
                photo=r.get("photo")
            ))
        return results

@router.get("/me", response_model=PatientBase)
async def get_current_patient_profile(
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return DEMO_PATIENTS[0]

    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    if user_id in ["usr-demo", "usr-patient-demo", "usr-demo-patient", "demo-patient", "usr-patient-01", "p-demo-ananya"]:
        return DEMO_PATIENTS[0]

    async with pool.acquire() as conn:
        await seed_initial_patient_if_empty(conn)
        row = await conn.fetchrow("""
            SELECT p.*, u.phone as user_phone, u.email as user_email
            FROM patients p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1 OR p.id = $1
        """, user_id)

        if not row:
            u_row = await conn.fetchrow("SELECT email FROM users WHERE id = $1", user_id)
            if u_row and u_row["email"] == "ananya.sharma@example.com":
                return DEMO_PATIENTS[0]
            raise HTTPException(status_code=404, detail="Patient profile not found for authenticated user.")

        return PatientBase(
            id=row["id"],
            mrn=row["mrn"],
            name=row["name"],
            dept=row["dept"] or "Cardiology",
            age=compute_age(row.get("dob"), row["age"]),
            dob=row.get("dob"),
            gender=row["gender"],
            blood=row["blood"],
            priority=row["priority"] or "NORMAL",
            status=row["status"] or "WAITING",
            lastVisit=row["last_visit"],
            nextAppointment=row["next_appointment"],
            allergies=row["allergies"] or "",
            meds=row["meds"] or "",
            history=format_history(row["history"]),
            reason=row["reason"] or "",
            recommendation=row["recommendation"] or "",
            heartRate=row["heart_rate"] or "72 bpm",
            phone=row.get("user_phone"),
            email=row.get("user_email"),
            emergency_contact=row.get("emergency_contact"),
            photo=row.get("photo"),
            hospital_id=row.get("hospital_id") or "hsp-001"
        )

@router.get("/me/ambulance-number")
async def get_patient_hospital_ambulance_number(
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    if not pool:
        return {
            "hospital_id": "hsp-001",
            "hospital_name": "CityCare Hospital",
            "ambulance_number": settings.DEMO_AMBULANCE_CONTACT,
            "emergency_phone": settings.DEMO_EMERGENCY_CONTACT
        }

    async with pool.acquire() as conn:
        p = await conn.fetchrow("""
            SELECT p.id, p.hospital_id, u.hospital_id as user_hsp_id
            FROM patients p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1 OR p.id = $1
        """, user_id)

        h_id = (p["hospital_id"] if p and p["hospital_id"] else None) or (p["user_hsp_id"] if p and p["user_hsp_id"] else None)
        
        if not h_id and user_id in ["usr-demo", "usr-demo-patient", "p-demo-ananya"]:
            h_id = "hsp-001"

        if not h_id:
            u = await conn.fetchrow("SELECT hospital_id FROM users WHERE id = $1", user_id)
            if u and u["hospital_id"]:
                h_id = u["hospital_id"]
            else:
                h_id = "hsp-001"

        h = await conn.fetchrow("SELECT id, name, phone, emergency_phone, ambulance_phone FROM hospitals WHERE id = $1", h_id)
        if not h:
            h = await conn.fetchrow("SELECT id, name, phone, emergency_phone, ambulance_phone FROM hospitals ORDER BY created_at ASC LIMIT 1")

        if not h:
            return {
                "hospital_id": "hsp-001",
                "hospital_name": "CityCare Hospital",
                "ambulance_number": settings.DEMO_AMBULANCE_CONTACT,
                "emergency_phone": settings.DEMO_EMERGENCY_CONTACT
            }

        amb_num = h["ambulance_phone"] or h["emergency_phone"] or h["phone"]
        return {
            "hospital_id": h["id"],
            "hospital_name": h["name"],
            "ambulance_number": amb_num,
            "emergency_phone": h["emergency_phone"] or amb_num
        }

@router.put("/me", response_model=PatientBase)
@router.patch("/me", response_model=PatientBase)
async def update_patient_profile(
    update: PatientUpdate,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        p = DEMO_PATIENTS[0]
        if update.allergies is not None: p.allergies = update.allergies
        if update.meds is not None: p.meds = update.meds
        if update.history is not None: p.history = update.history
        if update.name is not None: p.name = update.name
        if update.age is not None: p.age = update.age
        if update.dob is not None: p.dob = update.dob
        if update.gender is not None: p.gender = update.gender
        if update.blood is not None: p.blood = update.blood
        if update.phone is not None: p.phone = update.phone
        if update.emergency_contact is not None: p.emergency_contact = update.emergency_contact
        if update.photo is not None: p.photo = update.photo
        return p

    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    if user_id in ["usr-demo", "usr-patient-demo", "usr-demo-patient", "demo-patient", "usr-patient-01", "p-demo-ananya"]:
        p = DEMO_PATIENTS[0]
        if update.allergies is not None: p.allergies = update.allergies
        if update.meds is not None: p.meds = update.meds
        if update.history is not None: p.history = update.history
        if update.name is not None: p.name = update.name
        if update.age is not None: p.age = update.age
        if update.dob is not None: p.dob = update.dob
        if update.gender is not None: p.gender = update.gender
        if update.blood is not None: p.blood = update.blood
        if update.phone is not None: p.phone = update.phone
        if update.emergency_contact is not None: p.emergency_contact = update.emergency_contact
        if update.photo is not None: p.photo = update.photo
        return p

    async with pool.acquire() as conn:
        await seed_initial_patient_if_empty(conn)
        row = await conn.fetchrow("SELECT * FROM patients WHERE user_id = $1 OR id = $1", user_id)
        if not row:
            raise HTTPException(status_code=404, detail="Patient profile not found for authenticated user.")

        patient_id = row["id"]
        resolved_user_id = row["user_id"] or user_id

        history_val = json.dumps(update.history) if update.history is not None else None

        await conn.execute(
            """UPDATE patients 
               SET allergies = COALESCE($1, allergies),
                   meds = COALESCE($2, meds),
                   history = COALESCE($3::jsonb, history),
                   name = COALESCE($4, name),
                   age = COALESCE($5, age),
                   gender = COALESCE($6, gender),
                   blood = COALESCE($7, blood),
                   emergency_contact = COALESCE($8, emergency_contact),
                   photo = COALESCE($9, photo),
                   dob = COALESCE($10, dob)
               WHERE id = $11""",
            update.allergies, update.meds, history_val, update.name, update.age, update.gender, update.blood, update.emergency_contact, update.photo, update.dob, patient_id
        )

        if update.phone and resolved_user_id:
            await conn.execute(
                "UPDATE users SET phone = $1 WHERE id = $2",
                update.phone, resolved_user_id
            )
        if update.name and resolved_user_id:
            await conn.execute(
                "UPDATE users SET full_name = $1 WHERE id = $2",
                update.name, resolved_user_id
            )
        
        updated = await conn.fetchrow("""
            SELECT p.*, u.phone as user_phone, u.email as user_email
            FROM patients p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = $1
        """, patient_id)
        res = PatientBase(
            id=updated["id"],
            mrn=updated["mrn"],
            name=updated["name"],
            dept=updated["dept"] or "Cardiology",
            age=compute_age(updated.get("dob"), updated["age"]),
            dob=updated.get("dob"),
            gender=updated["gender"],
            blood=updated["blood"],
            priority=updated["priority"] or "NORMAL",
            status=updated["status"] or "WAITING",
            lastVisit=updated["last_visit"],
            nextAppointment=updated["next_appointment"],
            allergies=updated["allergies"] or "",
            meds=updated["meds"] or "",
            history=format_history(updated["history"]),
            reason=updated["reason"] or "",
            recommendation=updated["recommendation"] or "",
            heartRate=updated["heart_rate"] or "72 bpm",
            phone=updated.get("user_phone"),
            email=updated.get("user_email"),
            emergency_contact=updated.get("emergency_contact"),
            photo=updated.get("photo")
        )
        
        # Sync in-memory demo patient as well
        DEMO_PATIENTS[0].allergies = res.allergies
        DEMO_PATIENTS[0].meds = res.meds
        DEMO_PATIENTS[0].history = res.history
        DEMO_PATIENTS[0].name = res.name
        DEMO_PATIENTS[0].age = res.age
        DEMO_PATIENTS[0].gender = res.gender
        DEMO_PATIENTS[0].blood = res.blood
        if res.phone: DEMO_PATIENTS[0].phone = res.phone
        if res.emergency_contact: DEMO_PATIENTS[0].emergency_contact = res.emergency_contact
        if res.photo: DEMO_PATIENTS[0].photo = res.photo
        return res

@router.get("/{patient_id}", response_model=PatientBase)
async def get_patient_by_id(patient_id: str, pool: asyncpg.Pool = Depends(get_db_pool)):
    if patient_id in ["pt-demo-01", "p-demo-ananya", "p1"]:
        return DEMO_PATIENTS[0]

    if not pool:
        for p in DEMO_PATIENTS:
            if p.id == patient_id or patient_id.startswith("pt-"):
                return p
        return DEMO_PATIENTS[0]

    async with pool.acquire() as conn:
        await seed_initial_patient_if_empty(conn)
        row = await conn.fetchrow("SELECT * FROM patients WHERE id = $1", patient_id)
        if not row:
            row = await conn.fetchrow("SELECT * FROM patients ORDER BY created_at ASC LIMIT 1")
        if not row:
            return DEMO_PATIENTS[0]
        return PatientBase(
            id=row["id"],
            mrn=row["mrn"],
            name=row["name"],
            dept=row["dept"] or "Cardiology",
            age=compute_age(row.get("dob"), row["age"]),
            dob=row.get("dob"),
            gender=row["gender"],
            blood=row["blood"],
            priority=row["priority"] or "NORMAL",
            status=row["status"] or "WAITING",
            lastVisit=row["last_visit"],
            nextAppointment=row["next_appointment"],
            allergies=row["allergies"] or "",
            meds=row["meds"] or "",
            history=format_history(row["history"]),
            reason=row["reason"] or "",
            recommendation=row["recommendation"] or "",
            heartRate=row["heart_rate"] or "72 bpm",
            emergency_contact=row.get("emergency_contact"),
            photo=row.get("photo")
        )

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_FILE_SIZE = 5 * 1024 * 1024

@router.post("/me/photo")
async def upload_patient_photo(
    request: Request,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required to upload photo.")

    content_type = (request.headers.get("content-type") or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Allowed image types: JPEG, PNG, WEBP."
        )

    content = await request.body()
    if not content:
        raise HTTPException(status_code=400, detail="Empty image file body.")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum limit of 5MB."
        )

    ext = ALLOWED_IMAGE_TYPES[content_type]
    filename = f"patient_{user_id}_{uuid.uuid4().hex[:8]}{ext}"
    os.makedirs("uploads", exist_ok=True)
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as f:
        f.write(content)

    photo_url = f"http://localhost:8000/uploads/{filename}"

    if pool:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT id FROM patients WHERE user_id = $1 OR id = $1", user_id)
            if not row:
                raise HTTPException(status_code=404, detail="Patient profile not found for authenticated user.")

            await conn.execute("UPDATE patients SET photo = $1 WHERE id = $2", photo_url, row["id"])

    DEMO_PATIENTS[0].photo = photo_url
    return {"photo": photo_url}

@router.post("/{patient_id}/take-consultancy", response_model=PatientBase)
async def take_patient_under_consultancy(
    patient_id: str,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    if not pool:
        for p in DEMO_PATIENTS:
            if p.id == patient_id or patient_id.startswith("pt-") or patient_id.startswith("p-"):
                p.status = "IN_CONSULTANCY"
                return p
        DEMO_PATIENTS[0].status = "IN_CONSULTANCY"
        return DEMO_PATIENTS[0]

    async with pool.acquire() as conn:
        doc_row = await conn.fetchrow("SELECT id, name, specialization, hospital_id FROM doctors WHERE user_id = $1 OR id = $1", user_id)
        doctor_id = doc_row["id"] if doc_row else "doc-001"
        doc_name = doc_row["name"] if doc_row else "Dr. Shiv Gupta"
        doc_dept = doc_row["specialization"] if doc_row else "Cardiology"
        hospital_id = doc_row["hospital_id"] if doc_row else "hsp-001"

        # Resolve target patient
        p_row = await conn.fetchrow("SELECT * FROM patients WHERE id = $1 OR user_id = $1", patient_id)
        if not p_row:
            p_row = await conn.fetchrow("SELECT * FROM patients WHERE id = 'p-demo-ananya' OR name ILIKE '%Ananya%' LIMIT 1")
        if not p_row:
            raise HTTPException(status_code=404, detail="Patient not found.")

        target_pid = p_row["id"]
        p_name = p_row["name"]
        p_age = compute_age(p_row.get("dob"), p_row["age"])
        p_gender = p_row["gender"]
        p_mrn = p_row["mrn"]
        p_dept = p_row["dept"] or doc_dept
        p_reason = p_row["reason"] or "OPD Consultation"

        # Atomic update of patient status from WAITING -> IN_CONSULTANCY
        updated = await conn.fetchrow(
            """UPDATE patients
               SET status = 'IN_CONSULTANCY'
               WHERE id = $1 AND (status = 'WAITING' OR status = 'IN_CONSULTANCY')
               RETURNING *""",
            target_pid
        )

        if not updated:
            current = await conn.fetchrow("SELECT status FROM patients WHERE id = $1", target_pid)
            if current and current["status"] == "COMPLETED":
                raise HTTPException(status_code=400, detail="Patient consultation has already been completed.")
            raise HTTPException(status_code=400, detail="Patient has already been taken under consultancy by another doctor.")

        # Ensure appointment exists in PostgreSQL for this doctor & patient with status 'TODAY'
        apt = await conn.fetchrow(
            """SELECT id FROM appointments
               WHERE patient_id = $1 AND doctor_id = $2 AND status IN ('TODAY', 'UPCOMING')""",
            target_pid, doctor_id
        )

        if apt:
            await conn.execute(
                "UPDATE appointments SET status = 'TODAY', updated_at = NOW() WHERE id = $1",
                apt["id"]
            )
        else:
            apt_id = f"apt-{uuid.uuid4().hex[:8]}"
            booking_id = f"BK-{uuid.uuid4().hex[:6].upper()}"
            parts = p_name.split()
            initials = "".join([p[0].upper() for p in parts if p]) if parts else "PT"
            age_g = f"{p_age} / {p_gender}"
            today_str = datetime.now().strftime("%Y-%m-%d")

            await conn.execute(
                """INSERT INTO appointments
                   (id, booking_id, patient_id, doctor_id, patient_name, age_gender, mrn, department, modality, time, date_label, date, status, reason, initials, clinical_brief, hospital_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Room 304 Consult', 'Now', 'Today', $9, 'TODAY', $10, $11, $12, $13)""",
                apt_id, booking_id, target_pid, doctor_id, p_name, age_g, p_mrn, p_dept, today_str, p_reason, initials, "Patient taken under active consultancy.", hospital_id
            )

        return PatientBase(
            id=updated["id"],
            mrn=updated["mrn"],
            name=updated["name"],
            dept=updated["dept"] or "Cardiology",
            age=compute_age(updated.get("dob"), updated["age"]),
            dob=updated.get("dob"),
            gender=updated["gender"],
            blood=updated["blood"],
            priority=updated["priority"] or "NORMAL",
            status=updated["status"] or "IN_CONSULTANCY",
            lastVisit=updated["last_visit"],
            nextAppointment=updated["next_appointment"],
            allergies=updated["allergies"] or "",
            meds=updated["meds"] or "",
            history=format_history(updated["history"]),
            reason=updated["reason"] or "",
            recommendation=updated["recommendation"] or "",
            heartRate=updated["heart_rate"] or "72 bpm",
            emergency_contact=updated.get("emergency_contact"),
            photo=updated.get("photo")
        )


