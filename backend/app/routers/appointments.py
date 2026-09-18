import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Header
import asyncpg
from app.core.database import get_db_pool
from app.core.security import decode_access_token
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentSchema,
    AppointmentUpdate
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def get_user_id_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        if token in ["demo-fallback-token", "demo-doctor", "usr-doc-demo"]:
            return "usr-doc-demo"
        if token in ["demo-patient-token", "demo-patient", "usr-patient-demo", "usr-demo-patient"]:
            return "usr-demo-patient"
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            return payload["sub"]
    return None

@router.post("", response_model=AppointmentSchema)
async def create_appointment(
    req: AppointmentCreateRequest,
    patient_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    
    apt_id = f"apt-{uuid.uuid4().hex[:8]}"
    booking_id = f"BK-{uuid.uuid4().hex[:6].upper()}"

    target_patient_id = req.patient_id or patient_id or "pt-demo-01"
    target_doctor_id = req.doctor_id

    if not pool:
        return AppointmentSchema(
            id=apt_id,
            bookingId=booking_id,
            name="Ananya Sharma",
            ageGender="29 / F",
            mrn="ABHA-MN-9921",
            department="General Cardiology",
            modality=req.modality,
            time=req.time,
            dateLabel="Scheduled",
            date=req.date,
            status="UPCOMING",
            reason=req.reason,
            initials="AS",
            bgColor="#EFF6FF",
            clinicalBrief=req.clinical_notes or "Patient requested appointment.",
            doctor={"id": target_doctor_id or "doc-001", "name": "Dr. Shiv Gupta", "specialization": "Cardiologist"},
            coverage={"provider": "CGHS Standard", "status": "VERIFIED"}
        )

    async with pool.acquire() as conn:
        # 1. Resolve Doctor
        doc_row = None
        if target_doctor_id:
            doc_row = await conn.fetchrow("SELECT id, name, specialization, hospital_id FROM doctors WHERE id = $1 OR user_id = $1", target_doctor_id)
        
        if not doc_row and user_id:
            doc_row = await conn.fetchrow("SELECT id, name, specialization, hospital_id FROM doctors WHERE user_id = $1 OR id = $1", user_id)
            
        if not doc_row:
            doc_row = await conn.fetchrow("SELECT id, name, specialization, hospital_id FROM doctors ORDER BY created_at ASC LIMIT 1")
            
        final_doc_id = doc_row["id"] if doc_row else (target_doctor_id or "doc-001")
        doc_name = doc_row["name"] if doc_row else "Dr. Doctor"
        doc_dept = doc_row["specialization"] if doc_row else "General Medicine"
        hospital_id = doc_row["hospital_id"] if doc_row else "hsp-001"

        # 2. Resolve Patient
        pat_row = None
        if target_patient_id:
            pat_row = await conn.fetchrow("SELECT id, name, age, dob, gender, mrn FROM patients WHERE id = $1 OR user_id = $1", target_patient_id)
        
        if not pat_row and user_id and not doc_row:
            pat_row = await conn.fetchrow("SELECT id, name, age, dob, gender, mrn FROM patients WHERE user_id = $1 OR id = $1", user_id)

        if not pat_row:
            pat_row = await conn.fetchrow("SELECT id, name, age, dob, gender, mrn FROM patients WHERE id = 'pt-demo-01' OR name ILIKE '%Ananya%' LIMIT 1")

        from datetime import datetime
        def calc_age(dob_str, fallback):
            if not dob_str: return fallback
            try:
                b = datetime.strptime(dob_str, "%Y-%m-%d")
                t = datetime.today()
                return t.year - b.year - ((t.month, t.day) < (b.month, b.day))
            except:
                return fallback

        final_pat_id = pat_row["id"] if pat_row else (target_patient_id or "pt-demo-01")
        p_name = pat_row["name"] if pat_row else "Patient"
        p_age = calc_age(pat_row.get("dob"), pat_row["age"]) if pat_row else 30
        p_gender = pat_row["gender"] if pat_row else "F"
        p_mrn = pat_row["mrn"] if pat_row else "ABHA-MN-0000"

        # 3. Check Conflict
        conflict = await conn.fetchrow(
            """SELECT id FROM appointments 
               WHERE doctor_id = $1 AND date = $2 AND time = $3 AND status != 'CANCELLED'""",
            final_doc_id, req.date, req.time
        )
        if conflict:
            raise HTTPException(
                status_code=400,
                detail=f"Doctor already has an appointment scheduled at {req.time} on {req.date}."
            )

        # 4. Insert Appointment
        parts = p_name.split()
        initials = "".join([p[0].upper() for p in parts if p]) if parts else "PT"
        age_gender = f"{p_age} / {p_gender}"
        clinical_brief = req.clinical_notes or f"Scheduled appointment for {req.reason}."

        await conn.execute(
            """INSERT INTO appointments
               (id, booking_id, patient_id, doctor_id, patient_name, age_gender, mrn, department, modality, time, date_label, date, status, reason, initials, clinical_brief, hospital_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'UPCOMING', $13, $14, $15, $16)""",
            apt_id, booking_id, final_pat_id, final_doc_id, p_name, age_gender, p_mrn, doc_dept, req.modality, req.time, req.date, req.date, req.reason, initials, clinical_brief, hospital_id
        )

        return AppointmentSchema(
            id=apt_id,
            bookingId=booking_id,
            name=p_name,
            ageGender=f"{p_age} / {p_gender}",
            mrn=p_mrn,
            department=doc_dept,
            modality=req.modality,
            time=req.time,
            dateLabel=req.date,
            date=req.date,
            status="UPCOMING",
            reason=req.reason,
            initials=initials,
            bgColor="#EFF6FF",
            clinicalBrief=clinical_brief,
            doctor={"id": final_doc_id, "name": doc_name, "specialization": doc_dept},
            coverage={"provider": "Standard Health Insurance", "status": "VERIFIED"}
        )

MOCK_APPOINTMENTS = [
    {
        "id": "apt-001",
        "bookingId": "BK-99120",
        "name": "Ananya Sharma",
        "ageGender": "29 / F",
        "mrn": "ABHA-MN-9921",
        "department": "General Cardiology",
        "modality": "In-person",
        "time": "03:30 PM",
        "dateLabel": "Today",
        "date": "2026-09-12",
        "status": "TODAY",
        "reason": "Routine Hypertension & Autonomic Checkup",
        "initials": "AS",
        "bgColor": "#EFF6FF",
        "clinicalBrief": "Patient reports mild palpitations during evening workouts.",
        "doctor": {"id": "doc-001", "name": "Dr. Shiv Gupta", "specialization": "Cardiologist"},
        "coverage": {"provider": "CGHS Standard", "status": "VERIFIED"}
    },
    {
        "id": "apt-002",
        "bookingId": "BK-99144",
        "name": "Rajesh Kumar",
        "ageGender": "54 / M",
        "mrn": "ABHA-MN-8841",
        "department": "Pulmonology",
        "modality": "Tele-consult",
        "time": "11:00 AM",
        "dateLabel": "Tomorrow",
        "date": "2026-09-13",
        "status": "UPCOMING",
        "reason": "Post-COVID Pulmonary Function Review",
        "initials": "RK",
        "bgColor": "#F0FDF4",
        "clinicalBrief": "FGU on spirometry findings.",
        "doctor": {"id": "doc-002", "name": "Dr. Kavita Verma", "specialization": "Pulmonologist"},
        "coverage": {"provider": "Ayushman Bharat", "status": "ACTIVE"}
    }
]

@router.get("", response_model=List[AppointmentSchema])
async def list_appointments(
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    hospital_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return [AppointmentSchema(**apt) for apt in MOCK_APPOINTMENTS]

    user_id = get_user_id_from_header(authorization)
    filter_doctor_id = doctor_id
    filter_patient_id = patient_id

    async with pool.acquire() as conn:
        # If user_id is provided and no explicit filter is given, determine role
        if user_id and not filter_doctor_id and not filter_patient_id:
            d_row = await conn.fetchrow("SELECT id FROM doctors WHERE user_id = $1 OR id = $1", user_id)
            if d_row:
                filter_doctor_id = d_row["id"]
            else:
                p_row = await conn.fetchrow("SELECT id FROM patients WHERE user_id = $1 OR id = $1", user_id)
                if p_row:
                    filter_patient_id = p_row["id"]

        query = """
            SELECT a.*, p.name as patient_name, p.age, p.gender, p.mrn, d.name as doctor_name, d.specialization
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE 1=1
        """
        args = []
        if filter_doctor_id:
            args.append(filter_doctor_id)
            query += f" AND a.doctor_id = ${len(args)}"
        if filter_patient_id:
            args.append(filter_patient_id)
            query += f" AND a.patient_id = ${len(args)}"
        if hospital_id:
            args.append(hospital_id)
            query += f" AND a.hospital_id = ${len(args)}"
            
        query += " ORDER BY a.created_at DESC"
        
        rows = await conn.fetch(query, *args)
        
        results = []
        for r in rows:
            p_name = r['patient_name'] or "Patient"
            parts = p_name.split()
            initials = "".join([p[0].upper() for p in parts if p]) if parts else "PT"
            age_g = f"{r['age'] or 30} / {r['gender'] or 'F'}"
            
            results.append(AppointmentSchema(
                id=r['id'],
                bookingId=r['booking_id'] or "BK-00000",
                name=p_name,
                ageGender=age_g,
                mrn=r['mrn'] or "ABHA-MN-000",
                department=r['specialization'] or "General Medicine",
                modality=r['modality'] or "In-person",
                time=r['time'] or "10:00 AM",
                dateLabel=r['date'] or "Today",
                date=r['date'] or "2026-09-12",
                status=r['status'] or "UPCOMING",
                reason=r['reason'] or "",
                initials=initials,
                bgColor="#EFF6FF",
                clinicalBrief=r['clinical_brief'] or "",
                doctor={"id": r['doctor_id'], "name": r['doctor_name'] or "Doctor", "specialization": r['specialization'] or "Specialist"},
                coverage={"provider": "Standard Health Insurance", "status": "VERIFIED"}
            ))

        return results

@router.patch("/{appointment_id}", response_model=AppointmentSchema)
async def update_appointment(
    appointment_id: str,
    body: AppointmentUpdate,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        for apt in MOCK_APPOINTMENTS:
            if apt["id"] == appointment_id:
                if body.time:
                    apt["time"] = body.time
                if body.date:
                    apt["date"] = body.date
                    apt["dateLabel"] = body.date
                if body.status:
                    apt["status"] = body.status
                if body.clinicalBrief:
                    apt["clinicalBrief"] = body.clinicalBrief
                return AppointmentSchema(**apt)
        raise HTTPException(status_code=404, detail="Appointment not found.")

    async with pool.acquire() as conn:
        apt = await conn.fetchrow("SELECT * FROM appointments WHERE id = $1", appointment_id)
        if not apt:
            raise HTTPException(status_code=404, detail="Appointment not found.")

        if body.status == "CANCELLED" and apt["status"] == "CANCELLED":
            raise HTTPException(status_code=400, detail="Appointment is already cancelled.")
            
        await conn.execute(
            """UPDATE appointments
               SET date = COALESCE($1, date),
                   time = COALESCE($2, time),
                   status = COALESCE($3, status),
                   clinical_brief = COALESCE($4, clinical_brief),
                   updated_at = NOW()
               WHERE id = $5""",
            body.date, body.time, body.status, body.clinicalBrief, appointment_id
        )
        
        updated = await conn.fetchrow(
            """SELECT a.*, p.name as patient_name, p.age, p.gender, p.mrn, d.name as doctor_name, d.specialization
               FROM appointments a
               LEFT JOIN patients p ON a.patient_id = p.id
               LEFT JOIN doctors d ON a.doctor_id = d.id
               WHERE a.id = $1""",
            appointment_id
        )
        
        p_name = updated['patient_name'] or "Patient"
        parts = p_name.split()
        initials = "".join([p[0].upper() for p in parts if p]) if parts else "PT"
        
        return AppointmentSchema(
            id=updated['id'],
            bookingId=updated['booking_id'] or "BK-00000",
            name=p_name,
            ageGender=f"{updated['age'] or 30} / {updated['gender'] or 'F'}",
            mrn=updated['mrn'] or "ABHA-MN-000",
            department=updated['specialization'] or "General Medicine",
            modality=updated['modality'] or "In-person",
            time=updated['time'] or "10:00 AM",
            dateLabel=updated['date'] or "Today",
            date=updated['date'] or "2026-09-12",
            status=updated['status'] or "UPCOMING",
            reason=updated['reason'] or "",
            initials=initials,
            bgColor="#EFF6FF",
            clinicalBrief=updated['clinical_brief'] or "",
            doctor={"id": updated['doctor_id'], "name": updated['doctor_name'] or "Doctor", "specialization": updated['specialization'] or "Specialist"},
            coverage={"provider": "Standard Health Insurance", "status": "VERIFIED"}
        )

@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if pool:
        async with pool.acquire() as conn:
            await conn.execute("UPDATE appointments SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1", appointment_id)
    return {"message": f"Appointment {appointment_id} cancelled successfully."}
