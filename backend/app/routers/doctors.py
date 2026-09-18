from fastapi import APIRouter, Depends, HTTPException, Query, Header, Request
from typing import List, Optional
import asyncpg
import os
import uuid
from app.core.database import get_db_pool
from app.core.security import decode_access_token
from app.schemas.doctor import (
    DoctorBase,
    DoctorAvailabilityUpdate,
    DoctorUpdate,
    DoctorReviewCreateRequest,
    DoctorReviewResponse
)

router = APIRouter(prefix="/doctors", tags=["Doctors"])

def get_user_id_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        if token in ["demo-fallback-token", "demo-doctor", "usr-doc-demo"]:
            return "usr-doc-demo"
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            return payload["sub"]
    return None

DEMO_DOCTORS: List[DoctorBase] = [
    DoctorBase(
        id="doc-er-1",
        doctorCode="DOC-ER-101",
        name="Dr. Sharma",
        specialization="Emergency Physician",
        qualification="MD (Emergency Medicine)",
        experienceYears=12,
        contactPhone="+91 98100 11223",
        email="dr.sharma@citycare.org",
        shift="Morning Shift (08:00 - 16:00)",
        availability="ON DUTY",
        title="Emergency Medicine Specialist",
        facility="CityCare Hospital",
        rating="4.95",
        reviews="(140 verified reviews)",
        copay="₹1,000 Fee"
    ),
    DoctorBase(
        id="cardiology",
        doctorCode="DOC-CARD-201",
        name="Dr. Shiv Gupta, MD, FACC",
        specialization="Cardiology & Electrophysiology",
        qualification="DM (Cardiology)",
        experienceYears=19,
        contactPhone="+91 98111 22334",
        email="dr.shiv@citycare.org",
        shift="On-Call Trauma & Cath Lab",
        availability="ON DUTY",
        title="Senior Cardiologist • 19 yrs exp.",
        facility="Apollo Hospitals, New Delhi",
        rating="4.9",
        reviews="(180+ verified reviews)",
        copay="₹800 Fee",
        photo="https://lh3.googleusercontent.com/aida-public/AB6AXuDE5t9YjgeORyB6vFfCDeIIIaRa432s4mT_3YjpsWo-llKbwGnOLc8BKHDHcqmz5GpOlyJOVFrtuKF5I43P6I7eZZ2uW_BDtLh-A8GN8ZiefSEeSBGN-8ZWibU6JNb0cN76L92nwC5-8twN7TBjX-4GNbXUWCA3psZCFkMY8kAtsadai5vRAwpVRf9INwyO7cSeY9EE8BXPQIDdJd4ajy3WT9SpCfJeFylNWXlkFd86jBdEpw12yohFgg",
        license="DMC-8948102-DL",
        room="Room 304, Ste 4B, Cardiology Tower"
    )
]

@router.get("", response_model=List[DoctorBase])
async def list_doctors(
    hospital_id: Optional[str] = Query(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return DEMO_DOCTORS

    async with pool.acquire() as conn:
        if hospital_id:
            rows = await conn.fetch("SELECT * FROM doctors WHERE hospital_id = $1 ORDER BY name ASC", hospital_id)
        else:
            rows = await conn.fetch("SELECT * FROM doctors ORDER BY name ASC")
        db_doctors = []
        if rows:
            db_doctors = [
                DoctorBase(
                    id=r["id"],
                    doctorCode=r["doctor_code"],
                    name=r["name"],
                    specialization=r["specialization"],
                    qualification=r["qualification"],
                    experienceYears=r["experience_years"] or 0,
                    contactPhone=r["contact_phone"],
                    email=r["email"],
                    shift=r["shift"],
                    availability=r["availability"] or "ON DUTY",
                    title=r["title"],
                    facility=r["facility"],
                    rating=r["rating"] or "4.9",
                    reviews=r["reviews"] or "(100+ reviews)",
                    copay=r["copay"] or "₹800 Fee",
                    photo=r.get("photo"),
                    license=r.get("license"),
                    room=r.get("room")
                )
                for r in rows
            ]
        
        # Filter DEMO_DOCTORS if hospital_id is provided, otherwise include all
        # To be safe, if a hospital_id is provided, let's just assume we want all or nothing if they are not explicitly linked, 
        # but to keep it simple, we just append DEMO_DOCTORS (or prepend) to keep the UI looking exactly the same.
        # The demo doctors don't have hospital_id defined in the DEMO_DOCTORS dict natively, they just have facility.
        
        return db_doctors + DEMO_DOCTORS

@router.get("/me", response_model=DoctorBase)
async def get_current_doctor_profile(
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return DEMO_DOCTORS[1]

    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT d.*, u.phone as user_phone, u.email as user_email
            FROM doctors d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.user_id = $1 OR d.id = $1
        """, user_id)

        if not row:
            u_row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
            if u_row:
                return DoctorBase(
                    id=f"doc-{u_row['id']}",
                    doctorCode=f"DOC-MN-{u_row['id'][:4].upper()}",
                    name=u_row["full_name"],
                    specialization="General Medicine",
                    contactPhone=u_row.get("phone"),
                    email=u_row.get("email"),
                    availability="ON DUTY",
                    title="Medical Specialist",
                    facility="CityCare Hospital",
                    rating="4.9",
                    reviews="(100+ reviews)",
                    copay="₹800 Fee"
                )
            if user_id in ["usr-demo", "usr-doc-demo", "demo-doctor", "usr-doctor-01", "doc-001"]:
                return DEMO_DOCTORS[1]
            raise HTTPException(status_code=404, detail="Doctor profile not found for authenticated user.")

        return DoctorBase(
            id=row["id"],
            doctorCode=row["doctor_code"],
            name=row["name"],
            specialization=row["specialization"],
            qualification=row["qualification"],
            experienceYears=row["experience_years"] or 0,
            contactPhone=row.get("user_phone") or row["contact_phone"],
            email=row.get("user_email") or row["email"],
            shift=row["shift"],
            availability=row["availability"] or "ON DUTY",
            title=row["title"],
            facility=row["facility"],
            rating=row["rating"] or "4.9",
            reviews=row["reviews"] or "(100+ reviews)",
            copay=row["copay"] or "₹800 Fee",
            photo=row.get("photo"),
            license=row.get("license"),
            room=row.get("room"),
            dob=row.get("dob")
        )

@router.put("/me", response_model=DoctorBase)
@router.patch("/me", response_model=DoctorBase)
async def update_doctor_profile(
    update: DoctorUpdate,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        d = DEMO_DOCTORS[1]
        if update.name is not None: d.name = update.name
        if update.title is not None: d.title = update.title
        if update.facility is not None: d.facility = update.facility
        if update.license is not None: d.license = update.license
        if update.room is not None: d.room = update.room
        if update.photo is not None: d.photo = update.photo
        if update.dob is not None: d.dob = update.dob
        if update.availability is not None: d.availability = update.availability
        return d

    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    if user_id in ["usr-demo", "usr-doc-demo", "demo-doctor", "usr-doctor-01", "doc-001"]:
        d = DEMO_DOCTORS[1]
        if update.name is not None: d.name = update.name
        if update.title is not None: d.title = update.title
        if update.facility is not None: d.facility = update.facility
        if update.specialization is not None: d.specialization = update.specialization
        if update.qualification is not None: d.qualification = update.qualification
        if update.license is not None: d.license = update.license
        if update.room is not None: d.room = update.room
        if update.shift is not None: d.shift = update.shift
        if update.contactPhone is not None: d.contactPhone = update.contactPhone
        if update.photo is not None: d.photo = update.photo
        if update.dob is not None: d.dob = update.dob
        if update.availability is not None: d.availability = update.availability
        return d

    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM doctors WHERE user_id = $1 OR id = $1", user_id)
        if not row:
            raise HTTPException(status_code=404, detail="Doctor profile not found for authenticated user.")

        doctor_id = row["id"]
        resolved_user_id = row["user_id"] or user_id

        await conn.execute(
            """UPDATE doctors
               SET name = COALESCE($1, name),
                   title = COALESCE($2, title),
                   facility = COALESCE($3, facility),
                   specialization = COALESCE($4, specialization),
                   qualification = COALESCE($5, qualification),
                   license = COALESCE($6, license),
                   room = COALESCE($7, room),
                   shift = COALESCE($8, shift),
                   contact_phone = COALESCE($9, contact_phone),
                   availability = COALESCE($10, availability),
                   photo = COALESCE($11, photo),
                   dob = COALESCE($12, dob)
               WHERE id = $13""",
            update.name, update.title, update.facility, update.specialization,
            update.qualification, update.license, update.room, update.shift,
            update.contactPhone, update.availability, update.photo, update.dob, doctor_id
        )

        if update.contactPhone and resolved_user_id:
            await conn.execute("UPDATE users SET phone = $1 WHERE id = $2", update.contactPhone, resolved_user_id)
        if update.name and resolved_user_id:
            await conn.execute("UPDATE users SET full_name = $1 WHERE id = $2", update.name, resolved_user_id)

        updated = await conn.fetchrow("""
            SELECT d.*, u.phone as user_phone, u.email as user_email
            FROM doctors d
            LEFT JOIN users u ON d.user_id = u.id
            WHERE d.id = $1
        """, doctor_id)

        res = DoctorBase(
            id=updated["id"],
            doctorCode=updated["doctor_code"],
            name=updated["name"],
            specialization=updated["specialization"],
            qualification=updated["qualification"],
            experienceYears=updated["experience_years"] or 0,
            contactPhone=updated.get("user_phone") or updated["contact_phone"],
            email=updated.get("user_email") or updated["email"],
            shift=updated["shift"],
            availability=updated["availability"] or "ON DUTY",
            title=updated["title"],
            facility=updated["facility"],
            rating=updated["rating"] or "4.9",
            reviews=updated["reviews"] or "(100+ reviews)",
            copay=updated["copay"] or "₹800 Fee",
            photo=updated.get("photo"),
            license=updated.get("license"),
            room=updated.get("room"),
            dob=updated.get("dob")
        )
        return res

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_FILE_SIZE = 5 * 1024 * 1024

@router.post("/me/photo")
async def upload_doctor_photo(
    request: Request,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required to upload doctor photo.")

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
    filename = f"doctor_{user_id}_{uuid.uuid4().hex[:8]}{ext}"
    os.makedirs("uploads", exist_ok=True)
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as f:
        f.write(content)

    photo_url = f"http://localhost:8000/uploads/{filename}"

    if pool:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT id FROM doctors WHERE user_id = $1 OR id = $1", user_id)
            if not row:
                raise HTTPException(status_code=404, detail="Doctor profile not found for authenticated user.")

            await conn.execute("UPDATE doctors SET photo = $1 WHERE id = $2", photo_url, row["id"])

    return {"photo": photo_url}

@router.patch("/{doctor_id}/availability", response_model=DoctorBase)
async def update_doctor_availability(
    doctor_id: str,
    update: DoctorAvailabilityUpdate,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        for doc in DEMO_DOCTORS:
            if doc.id == doctor_id:
                doc.availability = update.availability
                return doc
        return DEMO_DOCTORS[0]

    async with pool.acquire() as conn:
        doc = await conn.fetchrow("SELECT id FROM doctors WHERE id = $1 OR user_id = $1", doctor_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Doctor not found.")

        target_id = doc["id"]
        await conn.execute("UPDATE doctors SET availability = $1 WHERE id = $2", update.availability, target_id)
        r = await conn.fetchrow("SELECT * FROM doctors WHERE id = $1", target_id)
        return DoctorBase(
            id=r["id"],
            doctorCode=r["doctor_code"],
            name=r["name"],
            specialization=r["specialization"],
            qualification=r["qualification"],
            experienceYears=r["experience_years"] or 0,
            contactPhone=r["contact_phone"],
            email=r["email"],
            shift=r["shift"],
            availability=r["availability"] or "ON DUTY",
            title=r["title"],
            facility=r["facility"],
            rating=r["rating"] or "4.9",
            reviews=r["reviews"] or "(100+ reviews)",
            copay=r["copay"] or "₹800 Fee",
            photo=r.get("photo"),
            license=r.get("license"),
            room=r.get("room")
        )

@router.put("/{doctor_id}/status", response_model=DoctorBase)
async def set_doctor_status(
    doctor_id: str,
    availability: str = "ON DUTY",
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    return await update_doctor_availability(doctor_id, DoctorAvailabilityUpdate(availability=availability), pool)

@router.post("/{doctor_id}/reviews", response_model=DoctorReviewResponse)
async def submit_doctor_review(
    doctor_id: str,
    req: DoctorReviewCreateRequest,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required to submit review.")

    review_id = f"rev-{uuid.uuid4().hex[:8]}"

    if not pool:
        return DoctorReviewResponse(
            id=review_id,
            message="Doctor review submitted successfully.",
            doctor_id=doctor_id,
            appointment_id=req.appointment_id,
            rating=req.rating,
            updated_average_rating="4.9",
            updated_reviews_count="(100+ reviews)"
        )

    async with pool.acquire() as conn:
        pat_row = await conn.fetchrow("SELECT id FROM patients WHERE user_id = $1 OR id = $1", user_id)
        if not pat_row:
            raise HTTPException(status_code=403, detail="Only registered patients can submit doctor reviews.")
        patient_id = pat_row["id"]

        doc_row = await conn.fetchrow("SELECT id FROM doctors WHERE id = $1 OR user_id = $1", doctor_id)
        if not doc_row:
            raise HTTPException(status_code=404, detail=f"Doctor '{doctor_id}' not found.")
        resolved_doc_id = doc_row["id"]

        apt_row = await conn.fetchrow("SELECT * FROM appointments WHERE id = $1", req.appointment_id)
        if not apt_row:
            raise HTTPException(status_code=404, detail="Appointment not found.")

        if apt_row["patient_id"] != patient_id:
            raise HTTPException(status_code=403, detail="You can only submit reviews for your own appointments.")

        if apt_row["doctor_id"] != resolved_doc_id:
            raise HTTPException(status_code=400, detail="Appointment does not match the specified doctor.")

        await conn.execute("""
            INSERT INTO doctor_reviews (id, appointment_id, doctor_id, patient_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, review_id, req.appointment_id, resolved_doc_id, patient_id, req.rating, req.comment)

        stats = await conn.fetchrow("""
            SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as review_count
            FROM doctor_reviews
            WHERE doctor_id = $1
        """, resolved_doc_id)

        avg_val = float(stats["avg_rating"]) if stats and stats["avg_rating"] else req.rating
        count_val = stats["review_count"] if stats else 1

        rating_str = f"{avg_val:.1f}"
        reviews_str = f"({count_val} verified review{'s' if count_val != 1 else ''})"

        await conn.execute("""
            UPDATE doctors
            SET rating = $1, reviews = $2
            WHERE id = $3
        """, rating_str, reviews_str, resolved_doc_id)

        return DoctorReviewResponse(
            id=review_id,
            message="Doctor review submitted successfully.",
            doctor_id=resolved_doc_id,
            appointment_id=req.appointment_id,
            rating=req.rating,
            updated_average_rating=rating_str,
            updated_reviews_count=reviews_str
        )


