import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from pydantic import BaseModel
import asyncpg
from app.core.database import get_db_pool
from app.core.security import decode_access_token

router = APIRouter(prefix="/admission-requests", tags=["Admission Requests"])

class AdmissionCreateRequest(BaseModel):
    hospital_id: str = "hsp-001"
    department_id: Optional[str] = "dept-cardio"
    reason: str

class AdmissionDecisionRequest(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    bed_id: Optional[str] = None
    decision_notes: Optional[str] = None

class DepartmentBedSummary(BaseModel):
    bed_id: str
    bed_type: str
    department_id: str
    department_name: str
    total: int
    occupied: int
    available: int
    floor_ward: str

class AdmissionResponseSchema(BaseModel):
    id: str
    patient_id: str
    hospital_id: str
    department_id: Optional[str] = None
    doctor_id: Optional[str] = None
    patient_name: str
    age_gender: Optional[str] = None
    mrn: Optional[str] = None
    department_name: Optional[str] = None
    status: str
    reason: str
    allocated_bed_id: Optional[str] = None
    allocated_bed_info: Optional[str] = None
    decision_notes: Optional[str] = None
    decided_at: Optional[str] = None
    created_at: Optional[str] = None
    bed_availability: Optional[List[DepartmentBedSummary]] = None

DEMO_ADMISSIONS: List[dict] = [
    {
        "id": "adm-demo-001",
        "patient_id": "p-demo-ananya",
        "hospital_id": "hsp-001",
        "department_id": "dept-cardio",
        "doctor_id": "doc-001",
        "patient_name": "Ananya Sharma",
        "age_gender": "29 / Female",
        "mrn": "91-4820-5912-4091",
        "department_name": "Cardiology & Vascular Medicine",
        "status": "PENDING",
        "reason": "Recurrent palpitations and acute chest tightness on exertion.",
        "allocated_bed_id": None,
        "allocated_bed_info": None,
        "decision_notes": None,
        "decided_at": None,
        "created_at": datetime.now().isoformat()
    }
]

def get_user_id_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        if token in ["demo-fallback-token", "demo-patient", "usr-demo"]:
            return "usr-demo-patient"
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            sub_id = payload["sub"]
            if sub_id == "usr-demo":
                return "usr-demo-patient"
            return sub_id
    return None

@router.post("", response_model=AdmissionResponseSchema)
async def create_admission_request(
    req: AdmissionCreateRequest,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    request_id = f"adm-{uuid.uuid4().hex[:8]}"

    if not pool:
        demo_resp = {
            **DEMO_ADMISSIONS[0],
            "id": request_id,
            "reason": req.reason,
            "status": "PENDING"
        }
        DEMO_ADMISSIONS.append(demo_resp)
        return AdmissionResponseSchema(**demo_resp)

    async with pool.acquire() as conn:
        # Resolve patient strictly from user_id (JWT sub -> users.id -> patients.user_id -> patient.id)
        patient = None
        if user_id:
            patient = await conn.fetchrow("SELECT * FROM patients WHERE user_id = $1 OR id = $1", user_id)
            if not patient and user_id in ["usr-demo", "usr-demo-patient", "demo-patient", "usr-patient-01", "p-demo-ananya"]:
                patient = await conn.fetchrow("SELECT * FROM patients WHERE id = 'p-demo-ananya' OR user_id = 'usr-demo-patient'")
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found for authenticated user.")

        p_id = patient["id"]
        p_name = patient["name"]
        
        from datetime import datetime
        def calc_age(dob_str, fallback):
            if not dob_str: return fallback
            try:
                b = datetime.strptime(dob_str, "%Y-%m-%d")
                t = datetime.today()
                return t.year - b.year - ((t.month, t.day) < (b.month, b.day))
            except:
                return fallback

        calc_a = calc_age(patient.get('dob'), patient.get('age') or 30)
        age_g = f"{calc_a} / {patient['gender']}"
        p_mrn = patient["mrn"]

        # Check if patient already has an active admission request or admission
        active_req = await conn.fetchrow(
            """SELECT id, status FROM admission_requests
               WHERE patient_id = $1 AND status IN ('PENDING', 'ADMITTED')""",
            p_id
        )
        if active_req:
            raise HTTPException(
                status_code=400,
                detail="Patient already has an active admission request or admission."
            )

        dept_name = "Cardiology & Vascular Medicine"
        if req.department_id:
            d_row = await conn.fetchrow("SELECT name FROM hospital_departments WHERE id = $1", req.department_id)
            if d_row:
                dept_name = d_row["name"]

        await conn.execute(
            """INSERT INTO admission_requests
               (id, patient_id, hospital_id, department_id, patient_name, age_gender, mrn, department_name, status, reason, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, NOW())""",
            request_id, p_id, req.hospital_id, req.department_id, p_name, age_g, p_mrn, dept_name, req.reason
        )

        row = await conn.fetchrow("SELECT * FROM admission_requests WHERE id = $1", request_id)
        return AdmissionResponseSchema(
            id=row["id"],
            patient_id=row["patient_id"],
            hospital_id=row["hospital_id"],
            department_id=row["department_id"],
            doctor_id=row["doctor_id"],
            patient_name=row["patient_name"],
            age_gender=row["age_gender"],
            mrn=row["mrn"],
            department_name=row["department_name"],
            status=row["status"],
            reason=row["reason"],
            allocated_bed_id=row["allocated_bed_id"],
            allocated_bed_info=row["allocated_bed_info"],
            decision_notes=row["decision_notes"],
            decided_at=str(row["decided_at"]) if row["decided_at"] else None,
            created_at=str(row["created_at"]) if row["created_at"] else None
        )

@router.get("/me", response_model=List[AdmissionResponseSchema])
async def get_my_admission_requests(
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    if not pool:
        return [AdmissionResponseSchema(**a) for a in DEMO_ADMISSIONS]

    async with pool.acquire() as conn:
        patient = None
        if user_id:
            patient = await conn.fetchrow("SELECT id FROM patients WHERE user_id = $1 OR id = $1", user_id)
            if not patient and user_id in ["usr-demo", "usr-demo-patient", "demo-patient", "usr-patient-01", "p-demo-ananya"]:
                patient = await conn.fetchrow("SELECT id FROM patients WHERE id = 'p-demo-ananya' OR user_id = 'usr-demo-patient'")
        
        if patient:
            rows = await conn.fetch("SELECT * FROM admission_requests WHERE patient_id = $1 ORDER BY created_at DESC", patient["id"])
        elif user_id:
            rows = await conn.fetch("SELECT * FROM admission_requests WHERE patient_id = $1 ORDER BY created_at DESC", user_id)
        else:
            rows = []

        if not rows:
            return [AdmissionResponseSchema(**a) for a in DEMO_ADMISSIONS]

        return [
            AdmissionResponseSchema(
                id=r["id"],
                patient_id=r["patient_id"],
                hospital_id=r["hospital_id"],
                department_id=r["department_id"],
                doctor_id=r["doctor_id"],
                patient_name=r["patient_name"],
                age_gender=r["age_gender"],
                mrn=r["mrn"],
                department_name=r["department_name"],
                status=r["status"],
                reason=r["reason"],
                allocated_bed_id=r["allocated_bed_id"],
                allocated_bed_info=r["allocated_bed_info"],
                decision_notes=r["decision_notes"],
                decided_at=str(r["decided_at"]) if r["decided_at"] else None,
                created_at=str(r["created_at"]) if r["created_at"] else None
            )
            for r in rows
        ]

@router.get("", response_model=List[AdmissionResponseSchema])
async def list_admission_requests(
    hospital_id: Optional[str] = Query("hsp-001"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        demo_beds = [
            DepartmentBedSummary(
                bed_id="b-cardio-1",
                bed_type="Cardiac ICU Bed",
                department_id="dept-cardio",
                department_name="Cardiology & Vascular Medicine",
                total=10,
                occupied=4,
                available=6,
                floor_ward="Cardiology Tower 3rd Floor"
            )
        ]
        return [AdmissionResponseSchema(**a, bed_availability=demo_beds) for a in DEMO_ADMISSIONS]

    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM admission_requests WHERE hospital_id = $1 ORDER BY created_at DESC", hospital_id)
        
        # Get live department beds
        bed_rows = await conn.fetch("""
            SELECT b.id as bed_id, b.bed_type, b.department_id, d.name as department_name,
                   b.total, b.occupied, b.available, b.floor_ward
            FROM department_beds b
            JOIN hospital_departments d ON b.department_id = d.id
            WHERE d.hospital_id = $1
        """, hospital_id)

        bed_summaries = [
            DepartmentBedSummary(
                bed_id=b["bed_id"],
                bed_type=b["bed_type"],
                department_id=b["department_id"],
                department_name=b["department_name"],
                total=b["total"],
                occupied=b["occupied"],
                available=b["available"],
                floor_ward=b["floor_ward"]
            )
            for b in bed_rows
        ]

        if not rows:
            return [AdmissionResponseSchema(**a, bed_availability=bed_summaries) for a in DEMO_ADMISSIONS]

        return [
            AdmissionResponseSchema(
                id=r["id"],
                patient_id=r["patient_id"],
                hospital_id=r["hospital_id"],
                department_id=r["department_id"],
                doctor_id=r["doctor_id"],
                patient_name=r["patient_name"],
                age_gender=r["age_gender"],
                mrn=r["mrn"],
                department_name=r["department_name"],
                status=r["status"],
                reason=r["reason"],
                allocated_bed_id=r["allocated_bed_id"],
                allocated_bed_info=r["allocated_bed_info"],
                decision_notes=r["decision_notes"],
                decided_at=str(r["decided_at"]) if r["decided_at"] else None,
                created_at=str(r["created_at"]) if r["created_at"] else None,
                bed_availability=bed_summaries
            )
            for r in rows
        ]

@router.post("/{request_id}/decision", response_model=AdmissionResponseSchema)
async def decide_admission_request(
    request_id: str,
    req: AdmissionDecisionRequest,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    action = req.action.upper()

    if not pool:
        for a in DEMO_ADMISSIONS:
            if a["id"] == request_id or request_id.startswith("adm-"):
                if action == "APPROVE":
                    a["status"] = "ADMITTED"
                    a["allocated_bed_id"] = req.bed_id or "b-cardio-1"
                    a["allocated_bed_info"] = "Cardiac ICU Bed (Cardiology Tower 3rd Floor)"
                    a["decision_notes"] = req.decision_notes or "Admission approved and bed allocated"
                else:
                    a["status"] = "REJECTED"
                    a["decision_notes"] = req.decision_notes or "Admission request rejected"
                a["decided_at"] = datetime.now().isoformat()
                return AdmissionResponseSchema(**a)
        return AdmissionResponseSchema(**DEMO_ADMISSIONS[0])

    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Lock admission request row
            req_row = await conn.fetchrow("SELECT * FROM admission_requests WHERE id = $1 FOR UPDATE", request_id)
            if not req_row:
                raise HTTPException(status_code=404, detail="Admission request not found.")

            if req_row["status"] not in ["PENDING"]:
                raise HTTPException(status_code=400, detail=f"Request has already been processed with status '{req_row['status']}'.")

            # Resolve doctor ID
            doc_id = None
            if user_id:
                d_row = await conn.fetchrow("SELECT id FROM doctors WHERE user_id = $1 OR id = $1", user_id)
                if d_row:
                    doc_id = d_row["id"]

            if action == "APPROVE":
                target_bed_id = req.bed_id
                bed_row = None
                
                if target_bed_id:
                    bed_row = await conn.fetchrow("SELECT * FROM department_beds WHERE id = $1 FOR UPDATE", target_bed_id)

                if not bed_row and req_row["department_id"]:
                    bed_row = await conn.fetchrow(
                        """SELECT b.* FROM department_beds b
                           JOIN hospital_departments d ON d.id = b.department_id
                           WHERE b.department_id = $1 AND d.hospital_id = $2 AND b.available > 0
                           LIMIT 1 FOR UPDATE""",
                        req_row["department_id"], req_row["hospital_id"]
                    )

                if not bed_row:
                    bed_row = await conn.fetchrow(
                        """SELECT b.* FROM department_beds b
                           JOIN hospital_departments d ON d.id = b.department_id
                           WHERE d.hospital_id = $1 AND b.available > 0
                           LIMIT 1 FOR UPDATE""",
                        req_row["hospital_id"]
                    )

                if not bed_row or bed_row["available"] <= 0:
                    raise HTTPException(
                        status_code=400,
                        detail="No beds available in the requested department. Admission approval denied."
                    )

                # Atomically occupy bed
                await conn.execute(
                    "UPDATE department_beds SET occupied = occupied + 1, available = GREATEST(0, available - 1) WHERE id = $1",
                    bed_row["id"]
                )

                # Update hospital total available emergency beds
                await conn.execute(
                    "UPDATE hospitals SET available_emergency_beds = GREATEST(0, available_emergency_beds - 1) WHERE id = $1",
                    req_row["hospital_id"]
                )

                bed_info = f"{bed_row['bed_type']} ({bed_row['floor_ward']})"
                notes = req.decision_notes or "Admission approved and bed allocated"

                await conn.execute(
                    """UPDATE admission_requests
                       SET status = 'ADMITTED',
                           doctor_id = $1,
                           allocated_bed_id = $2,
                           allocated_bed_info = $3,
                           decision_notes = $4,
                           decided_at = NOW()
                       WHERE id = $5""",
                    doc_id, bed_row["id"], bed_info, notes, request_id
                )
            else:  # REJECT
                notes = req.decision_notes or "Admission request rejected"
                await conn.execute(
                    """UPDATE admission_requests
                       SET status = 'REJECTED',
                           doctor_id = $1,
                           decision_notes = $2,
                           decided_at = NOW()
                       WHERE id = $3""",
                    doc_id, notes, request_id
                )

        # Fetch updated record outside transaction
        updated = await conn.fetchrow("SELECT * FROM admission_requests WHERE id = $1", request_id)
        return AdmissionResponseSchema(
            id=updated["id"],
            patient_id=updated["patient_id"],
            hospital_id=updated["hospital_id"],
            department_id=updated["department_id"],
            doctor_id=updated["doctor_id"],
            patient_name=updated["patient_name"],
            age_gender=updated["age_gender"],
            mrn=updated["mrn"],
            department_name=updated["department_name"],
            status=updated["status"],
            reason=updated["reason"],
            allocated_bed_id=updated["allocated_bed_id"],
            allocated_bed_info=updated["allocated_bed_info"],
            decision_notes=updated["decision_notes"],
            decided_at=str(updated["decided_at"]) if updated["decided_at"] else None,
            created_at=str(updated["created_at"]) if updated["created_at"] else None
        )

@router.post("/{request_id}/discharge", response_model=AdmissionResponseSchema)
async def discharge_patient(
    request_id: str,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)

    if not pool:
        for a in DEMO_ADMISSIONS:
            if a["id"] == request_id or request_id.startswith("adm-"):
                a["status"] = "DISCHARGED"
                a["decided_at"] = datetime.now().isoformat()
                return AdmissionResponseSchema(**a)
        return AdmissionResponseSchema(**DEMO_ADMISSIONS[0])

    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Lock admission request row
            req_row = await conn.fetchrow("SELECT * FROM admission_requests WHERE id = $1 FOR UPDATE", request_id)
            if not req_row:
                raise HTTPException(status_code=404, detail="Admission record not found.")

            if req_row["status"] != "ADMITTED":
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot discharge patient. Current admission status is '{req_row['status']}', expected 'ADMITTED'."
                )

            allocated_bed_id = req_row["allocated_bed_id"]

            # 2. Release allocated bed in department_beds if present
            if allocated_bed_id:
                bed_row = await conn.fetchrow("SELECT * FROM department_beds WHERE id = $1 FOR UPDATE", allocated_bed_id)
                if bed_row:
                    await conn.execute(
                        """UPDATE department_beds
                           SET occupied = GREATEST(0, occupied - 1),
                               available = LEAST(total, available + 1)
                           WHERE id = $1""",
                        allocated_bed_id
                    )

            # 3. Increment hospital total available emergency beds
            await conn.execute(
                """UPDATE hospitals
                   SET available_emergency_beds = LEAST(total_emergency_beds, available_emergency_beds + 1)
                   WHERE id = $1""",
                req_row["hospital_id"]
            )

            # 4. Update status to DISCHARGED
            notes = (req_row["decision_notes"] or "") + " [Discharged]"
            await conn.execute(
                """UPDATE admission_requests
                   SET status = 'DISCHARGED',
                       decision_notes = $1,
                       decided_at = NOW()
                   WHERE id = $2""",
                notes.strip(), request_id
            )

        updated = await conn.fetchrow("SELECT * FROM admission_requests WHERE id = $1", request_id)
        return AdmissionResponseSchema(
            id=updated["id"],
            patient_id=updated["patient_id"],
            hospital_id=updated["hospital_id"],
            department_id=updated["department_id"],
            doctor_id=updated["doctor_id"],
            patient_name=updated["patient_name"],
            age_gender=updated["age_gender"],
            mrn=updated["mrn"],
            department_name=updated["department_name"],
            status=updated["status"],
            reason=updated["reason"],
            allocated_bed_id=updated["allocated_bed_id"],
            allocated_bed_info=updated["allocated_bed_info"],
            decision_notes=updated["decision_notes"],
            decided_at=str(updated["decided_at"]) if updated["decided_at"] else None,
            created_at=str(updated["created_at"]) if updated["created_at"] else None
        )
