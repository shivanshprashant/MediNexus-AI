"""
Hospital Admin Portal — Backend Router
/api/admin/*

All endpoints here are protected:
1. JWT required (Bearer token)
2. Role must be 'hospital_admin'
3. hospital_id is derived server-side from the JWT — never trusted from the client.

This enforces strict hospital-level multi-tenancy (IDOR prevention).
"""

import uuid
import json
from datetime import datetime
from typing import List, Optional, Literal
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
import asyncpg
from app.core.database import get_db_pool
from app.core.security import decode_access_token

router = APIRouter(prefix="/admin", tags=["Hospital Admin"])


# ─────────────────────────────────────────────────
# Auth Dependency — Hospital Isolation Enforcement
# ─────────────────────────────────────────────────

class AdminContext:
    def __init__(self, user_id: str, hospital_id: str):
        self.user_id = user_id
        self.hospital_id = hospital_id


async def get_admin_context(authorization: Optional[str] = Header(None)) -> AdminContext:
    """
    Decodes the JWT and enforces that the caller is a hospital_admin.
    Derives hospital_id from the token — never from request body or query params.
    This is the core hospital-isolation enforcement point.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in as a Hospital Admin.")

    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please sign in again.")

    role = payload.get("role", "")
    if role != "hospital_admin":
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Hospital Admin role required. Your role: '{role}'."
        )

    user_id = payload.get("sub")
    hospital_id = payload.get("hospital_id")

    if not hospital_id:
        raise HTTPException(
            status_code=403,
            detail="Admin account is not associated with any hospital. Contact system administrator."
        )

    return AdminContext(user_id=user_id, hospital_id=hospital_id)


# ─────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────

class AdminDashboardStats(BaseModel):
    hospital_id: str
    hospital_name: str
    total_beds: int
    occupied_beds: int
    available_beds: int
    total_icu_beds: int
    available_icu_beds: int
    total_er_beds: int
    available_er_beds: int
    total_doctors: int
    doctors_on_duty: int
    total_departments: int
    active_departments: int
    active_emergency_requests: int
    pending_emergency_requests: int
    total_emergency_requests_today: int


class ActivityLogItem(BaseModel):
    id: str
    time: str
    message: str
    category: str  # 'emergency' | 'doctor' | 'bed' | 'system'
    created_at: Optional[str] = None


class DoctorAvailabilityUpdate(BaseModel):
    availability: Literal["ON DUTY", "OFF DUTY", "ON LEAVE"]


class NewDepartmentRequest(BaseModel):
    code: str
    name: str
    description: Optional[str] = ""
    contactPhone: Optional[str] = ""
    locationFloor: Optional[str] = "Ground Floor"
    operatingHours: Optional[str] = "24x7"
    is24x7: Optional[bool] = True
    hasEmergencySupport: Optional[bool] = False
    services: Optional[List[str]] = []


class NewBedRequest(BaseModel):
    department_id: str
    bed_type: str
    total: int
    floor_ward: str


class BedOccupancyUpdate(BaseModel):
    occupied: int


class BedResponse(BaseModel):
    id: str
    department_id: str
    bedType: str
    total: int
    occupied: int
    available: int
    floorWard: str


class DoctorListItem(BaseModel):
    id: str
    doctorCode: str
    name: str
    specialization: str
    qualification: Optional[str] = ""
    experienceYears: int
    contactPhone: Optional[str] = ""
    email: Optional[str] = ""
    shift: Optional[str] = ""
    availability: str
    departmentId: Optional[str] = None
    departmentName: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str
    contactPhone: str
    locationFloor: str
    operatingHours: str
    is24x7: bool
    hasEmergencySupport: bool
    status: str
    services: List[str] = []


# ─────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────

@router.get("/dashboard", response_model=AdminDashboardStats, summary="Get aggregated hospital dashboard statistics")
async def get_admin_dashboard(
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Returns aggregated operational statistics for the authenticated admin's hospital.
    hospital_id is derived from the JWT — cannot be spoofed.
    """
    hospital_id = admin.hospital_id

    if not pool:
        return AdminDashboardStats(
            hospital_id=hospital_id,
            hospital_name="CityCare Hospital",
            total_beds=170, occupied_beds=127, available_beds=43,
            total_icu_beds=30, available_icu_beds=8,
            total_er_beds=20, available_er_beds=8,
            total_doctors=8, doctors_on_duty=5,
            total_departments=6, active_departments=6,
            active_emergency_requests=3, pending_emergency_requests=1,
            total_emergency_requests_today=4
        )

    async with pool.acquire() as conn:
        # Hospital name
        hospital = await conn.fetchrow("SELECT name FROM hospitals WHERE id = $1", hospital_id)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found.")

        # Bed stats (aggregated across all departments of this hospital)
        bed_stats = await conn.fetchrow("""
            SELECT
                COALESCE(SUM(b.total), 0) as total_beds,
                COALESCE(SUM(b.occupied), 0) as occupied_beds,
                COALESCE(SUM(b.available), 0) as available_beds,
                COALESCE(SUM(CASE WHEN LOWER(b.bed_type) LIKE '%icu%' OR LOWER(b.bed_type) LIKE '%ccu%' OR LOWER(b.bed_type) LIKE '%nicu%' THEN b.total ELSE 0 END), 0) as total_icu,
                COALESCE(SUM(CASE WHEN LOWER(b.bed_type) LIKE '%icu%' OR LOWER(b.bed_type) LIKE '%ccu%' OR LOWER(b.bed_type) LIKE '%nicu%' THEN b.available ELSE 0 END), 0) as avail_icu,
                COALESCE(SUM(CASE WHEN LOWER(b.bed_type) LIKE '%emergency%' OR LOWER(b.bed_type) LIKE '%trauma%' OR LOWER(b.bed_type) LIKE '%triage%' THEN b.total ELSE 0 END), 0) as total_er,
                COALESCE(SUM(CASE WHEN LOWER(b.bed_type) LIKE '%emergency%' OR LOWER(b.bed_type) LIKE '%trauma%' OR LOWER(b.bed_type) LIKE '%triage%' THEN b.available ELSE 0 END), 0) as avail_er
            FROM department_beds b
            JOIN hospital_departments d ON d.id = b.department_id
            WHERE d.hospital_id = $1
        """, hospital_id)

        # Doctor stats
        doctor_stats = await conn.fetchrow("""
            SELECT
                COUNT(*) as total_doctors,
                SUM(CASE WHEN availability = 'ON DUTY' THEN 1 ELSE 0 END) as on_duty
            FROM doctors WHERE hospital_id = $1
        """, hospital_id)

        # Department stats
        dept_stats = await conn.fetchrow("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active
            FROM hospital_departments WHERE hospital_id = $1
        """, hospital_id)

        # Emergency request stats
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        emerg_stats = await conn.fetchrow("""
            SELECT
                COUNT(CASE WHEN status NOT IN ('RESOLVED', 'DISCHARGED', 'REJECTED', 'REDIRECTED', 'COMPLETED') THEN 1 END) as active_count,
                COUNT(CASE WHEN status IN ('REQUEST CREATED', 'HOSPITAL NOTIFIED') THEN 1 END) as pending_count,
                COUNT(CASE WHEN created_at >= $2 THEN 1 END) as today_count
            FROM emergency_requests WHERE hospital_id = $1
        """, hospital_id, today_start)

        return AdminDashboardStats(
            hospital_id=hospital_id,
            hospital_name=hospital["name"],
            total_beds=int(bed_stats["total_beds"]),
            occupied_beds=int(bed_stats["occupied_beds"]),
            available_beds=int(bed_stats["available_beds"]),
            total_icu_beds=int(bed_stats["total_icu"]),
            available_icu_beds=int(bed_stats["avail_icu"]),
            total_er_beds=int(bed_stats["total_er"]),
            available_er_beds=int(bed_stats["avail_er"]),
            total_doctors=int(doctor_stats["total_doctors"]),
            doctors_on_duty=int(doctor_stats["on_duty"] or 0),
            total_departments=int(dept_stats["total"]),
            active_departments=int(dept_stats["active"] or 0),
            active_emergency_requests=int(emerg_stats["active_count"] or 0),
            pending_emergency_requests=int(emerg_stats["pending_count"] or 0),
            total_emergency_requests_today=int(emerg_stats["today_count"] or 0)
        )


@router.get("/activity-logs", response_model=List[ActivityLogItem], summary="Get hospital activity log")
async def get_activity_logs(
    limit: int = 20,
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """Returns recent hospital activity log entries for the admin's hospital only."""
    hospital_id = admin.hospital_id

    if not pool:
        return [
            ActivityLogItem(id="act-1", time="10:42 AM", message="Emergency SOS received.", category="emergency"),
            ActivityLogItem(id="act-2", time="10:38 AM", message="Dr. Sharma marked ON DUTY.", category="doctor"),
        ]

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, time, message, category, created_at
            FROM hospital_activity_logs
            WHERE hospital_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        """, hospital_id, limit)

        return [
            ActivityLogItem(
                id=r["id"],
                time=r["time"],
                message=r["message"],
                category=r["category"],
                created_at=r["created_at"].isoformat() if r["created_at"] else None
            )
            for r in rows
        ]


@router.get("/doctors", response_model=List[DoctorListItem], summary="List all doctors for admin's hospital")
async def list_admin_doctors(
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """Returns all doctors belonging to the authenticated admin's hospital."""
    hospital_id = admin.hospital_id

    if not pool:
        return []

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT d.*, dept.name as dept_name
            FROM doctors d
            LEFT JOIN hospital_departments dept ON dept.id = d.department_id
            WHERE d.hospital_id = $1
            ORDER BY d.name ASC
        """, hospital_id)

        return [
            DoctorListItem(
                id=r["id"],
                doctorCode=r["doctor_code"],
                name=r["name"],
                specialization=r["specialization"],
                qualification=r["qualification"] or "",
                experienceYears=r["experience_years"] or 0,
                contactPhone=r["contact_phone"] or "",
                email=r["email"] or "",
                shift=r["shift"] or "",
                availability=r["availability"] or "ON DUTY",
                departmentId=r["department_id"],
                departmentName=r["dept_name"]
            )
            for r in rows
        ]


@router.patch("/doctors/{doctor_id}/availability", response_model=DoctorListItem, summary="Update doctor availability (admin-scoped)")
async def update_doctor_availability(
    doctor_id: str,
    body: DoctorAvailabilityUpdate,
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Updates a doctor's availability status.
    Enforces hospital isolation: admin can only update doctors in their own hospital.
    """
    hospital_id = admin.hospital_id

    if not pool:
        return DoctorListItem(
            id=doctor_id, doctorCode="DOC-001", name="Dr. Demo",
            specialization="General Medicine", experienceYears=5,
            availability=body.availability
        )

    async with pool.acquire() as conn:
        # Hospital isolation check: verify doctor belongs to admin's hospital
        doctor = await conn.fetchrow(
            "SELECT * FROM doctors WHERE id = $1 AND hospital_id = $2",
            doctor_id, hospital_id
        )
        if not doctor:
            # Return 404 to avoid revealing whether doctor exists in another hospital
            raise HTTPException(status_code=404, detail="Doctor not found.")

        await conn.execute(
            "UPDATE doctors SET availability = $1 WHERE id = $2",
            body.availability, doctor_id
        )

        # Log the action
        now_time = datetime.now().strftime("%I:%M %p")
        await conn.execute("""
            INSERT INTO hospital_activity_logs (id, hospital_id, time, message, category)
            VALUES ($1, $2, $3, $4, 'doctor')
        """, f"act-{uuid.uuid4().hex[:8]}", hospital_id, now_time,
            f"Dr. {doctor['name']} availability updated to {body.availability}")

        updated = await conn.fetchrow("""
            SELECT d.*, dept.name as dept_name
            FROM doctors d
            LEFT JOIN hospital_departments dept ON dept.id = d.department_id
            WHERE d.id = $1
        """, doctor_id)

        return DoctorListItem(
            id=updated["id"],
            doctorCode=updated["doctor_code"],
            name=updated["name"],
            specialization=updated["specialization"],
            qualification=updated["qualification"] or "",
            experienceYears=updated["experience_years"] or 0,
            contactPhone=updated["contact_phone"] or "",
            email=updated["email"] or "",
            shift=updated["shift"] or "",
            availability=updated["availability"],
            departmentId=updated["department_id"],
            departmentName=updated["dept_name"]
        )


@router.get("/departments", response_model=List[DepartmentResponse], summary="List departments for admin's hospital")
async def list_admin_departments(
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """Returns all departments for the authenticated admin's hospital."""
    hospital_id = admin.hospital_id

    if not pool:
        return []

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM hospital_departments
            WHERE hospital_id = $1
            ORDER BY created_at ASC
        """, hospital_id)

        result = []
        for r in rows:
            services_val = r["services"]
            if isinstance(services_val, str):
                try:
                    services_val = json.loads(services_val)
                except Exception:
                    services_val = []

            result.append(DepartmentResponse(
                id=r["id"],
                code=r["code"],
                name=r["name"],
                description=r["description"] or "",
                contactPhone=r["contact_phone"] or "",
                locationFloor=r["location_floor"] or "Ground Floor",
                operatingHours=r["operating_hours"] or "24x7",
                is24x7=r["is_24x7"],
                hasEmergencySupport=r["has_emergency_support"],
                status=r["status"] or "ACTIVE",
                services=services_val if isinstance(services_val, list) else []
            ))
        return result


@router.post("/departments", response_model=DepartmentResponse, summary="Add new department to admin's hospital")
async def add_department(
    body: NewDepartmentRequest,
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """Creates a new department under the admin's hospital."""
    hospital_id = admin.hospital_id
    dept_id = f"dept-{uuid.uuid4().hex[:10]}"
    services_json = json.dumps(body.services or [])

    if not pool:
        return DepartmentResponse(
            id=dept_id, code=body.code, name=body.name,
            description=body.description or "",
            contactPhone=body.contactPhone or "",
            locationFloor=body.locationFloor or "Ground Floor",
            operatingHours=body.operatingHours or "24x7",
            is24x7=body.is24x7 if body.is24x7 is not None else True,
            hasEmergencySupport=body.hasEmergencySupport if body.hasEmergencySupport is not None else False,
            status="ACTIVE",
            services=body.services or []
        )

    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO hospital_departments
                (id, hospital_id, code, name, description, contact_phone, location_floor,
                 operating_hours, is_24x7, has_emergency_support, services, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, 'ACTIVE')
        """, dept_id, hospital_id, body.code, body.name,
            body.description or "", body.contactPhone or "",
            body.locationFloor or "Ground Floor", body.operatingHours or "24x7",
            body.is24x7 if body.is24x7 is not None else True,
            body.hasEmergencySupport if body.hasEmergencySupport is not None else False,
            services_json)

        now_time = datetime.now().strftime("%I:%M %p")
        await conn.execute("""
            INSERT INTO hospital_activity_logs (id, hospital_id, time, message, category)
            VALUES ($1, $2, $3, $4, 'system')
        """, f"act-{uuid.uuid4().hex[:8]}", hospital_id, now_time,
            f"New department '{body.name}' added")

        return DepartmentResponse(
            id=dept_id, code=body.code, name=body.name,
            description=body.description or "",
            contactPhone=body.contactPhone or "",
            locationFloor=body.locationFloor or "Ground Floor",
            operatingHours=body.operatingHours or "24x7",
            is24x7=body.is24x7 if body.is24x7 is not None else True,
            hasEmergencySupport=body.hasEmergencySupport if body.hasEmergencySupport is not None else False,
            status="ACTIVE",
            services=body.services or []
        )


@router.get("/beds", response_model=List[BedResponse], summary="List all beds for admin's hospital")
async def list_admin_beds(
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """Returns all bed records for the authenticated admin's hospital."""
    hospital_id = admin.hospital_id

    if not pool:
        return []

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT b.*, d.hospital_id
            FROM department_beds b
            JOIN hospital_departments d ON d.id = b.department_id
            WHERE d.hospital_id = $1
            ORDER BY b.created_at ASC
        """, hospital_id)

        return [
            BedResponse(
                id=r["id"],
                department_id=r["department_id"],
                bedType=r["bed_type"],
                total=r["total"],
                occupied=r["occupied"],
                available=r["available"],
                floorWard=r["floor_ward"]
            )
            for r in rows
        ]


@router.put("/beds/{bed_id}", response_model=BedResponse, summary="Update bed occupancy (admin-scoped, hospital-isolated)")
async def update_bed_occupancy(
    bed_id: str,
    body: BedOccupancyUpdate,
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Updates bed occupancy count.
    Enforces hospital isolation: admin can only update beds in their own hospital.
    Uses optimistic locking to handle concurrent requests safely.
    """
    hospital_id = admin.hospital_id

    if not pool:
        from app.routers.hospitals import INITIAL_DETAILED_HOSPITAL
        updated_bed_resp = None
        
        for dept in INITIAL_DETAILED_HOSPITAL["departments"]:
            for b in dept["beds"]:
                if b["id"] == bed_id:
                    new_occ = max(0, min(b["total"], body.occupied))
                    b["occupied"] = new_occ
                    b["available"] = max(0, b["total"] - new_occ)
                    
                    updated_bed_resp = BedResponse(
                        id=b["id"], department_id=dept["id"],
                        bedType=b["bedType"], total=b["total"],
                        occupied=b["occupied"], available=b["available"],
                        floorWard=b["floorWard"]
                    )
                    break
            if updated_bed_resp:
                break
                
        if not updated_bed_resp:
            raise HTTPException(status_code=404, detail="Bed record not found in mock data.")

        total_b = sum(b["total"] for dept in INITIAL_DETAILED_HOSPITAL["departments"] for b in dept["beds"])
        vacant_b = sum(b["available"] for dept in INITIAL_DETAILED_HOSPITAL["departments"] for b in dept["beds"])
        
        # Also sync to DEMO_HOSPITALS_SIMPLE
        from app.routers.hospitals import DEMO_HOSPITALS_SIMPLE
        for h in DEMO_HOSPITALS_SIMPLE:
            if h["id"] == hospital_id:
                h["totalBeds"] = total_b
                h["vacantBeds"] = vacant_b
                break

        # Broadcast SSE for mock mode
        from app.services.sse_service import sse_manager
        await sse_manager.broadcast_global_event("BED_AVAILABILITY_UPDATED", {
            "hospital_id": hospital_id,
            "vacantBeds": vacant_b,
            "totalBeds": total_b,
            "updatedBed": updated_bed_resp.dict()
        })
        
        return updated_bed_resp

    async with pool.acquire() as conn:
        h_stats = None
        response = None
        async with conn.transaction():
            # Hospital isolation: verify this bed belongs to admin's hospital
            bed = await conn.fetchrow("""
                SELECT b.*, d.hospital_id
                FROM department_beds b
                JOIN hospital_departments d ON d.id = b.department_id
                WHERE b.id = $1
                FOR UPDATE
            """, bed_id)

            if not bed:
                raise HTTPException(status_code=404, detail="Bed record not found.")

            if bed["hospital_id"] != hospital_id:
                # Return 404, not 403, to prevent information leakage
                raise HTTPException(status_code=404, detail="Bed record not found.")

            new_occupied = max(0, min(bed["total"], body.occupied))
            new_available = max(0, bed["total"] - new_occupied)

            await conn.execute("""
                UPDATE department_beds
                SET occupied = $1, available = $2
                WHERE id = $3
            """, new_occupied, new_available, bed_id)

            # Log the bed update
            now_time = datetime.now().strftime("%I:%M %p")
            await conn.execute("""
                INSERT INTO hospital_activity_logs (id, hospital_id, time, message, category)
                VALUES ($1, $2, $3, $4, 'bed')
            """, f"act-{uuid.uuid4().hex[:8]}", hospital_id, now_time,
                f"Bed '{bed['bed_type']}' occupancy updated: {new_occupied}/{bed['total']}")

            # Fetch hospital bed stats to broadcast global event
            h_stats = await conn.fetchrow("""
                SELECT COALESCE(SUM(b.total), 0) as total_b, COALESCE(SUM(b.available), 0) as vacant_b
                FROM department_beds b
                JOIN hospital_departments d ON b.department_id = d.id
                WHERE d.hospital_id = $1 AND (d.code LIKE '%ER%' OR d.name ILIKE '%Emergency%')
            """, hospital_id)

            response = BedResponse(
                id=bed_id,
                department_id=bed["department_id"],
                bedType=bed["bed_type"],
                total=bed["total"],
                occupied=new_occupied,
                available=new_available,
                floorWard=bed["floor_ward"]
            )

        # Broadcast SSE AFTER transaction commit
        if response and h_stats:
            total_b = max(0, int(h_stats["total_b"]))
            vacant_b = max(0, min(total_b, int(h_stats["vacant_b"])))
            from app.services.sse_service import sse_manager
            await sse_manager.broadcast_global_event("BED_AVAILABILITY_UPDATED", {
                "hospital_id": hospital_id,
                "vacantBeds": vacant_b,
                "totalBeds": total_b,
                "updatedBed": response.dict()
            })

        return response


@router.post("/beds", response_model=BedResponse, summary="Add a new bed type to a department")
async def add_bed_to_department(
    body: NewBedRequest,
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Adds a new bed type/category to a department.
    Verifies the department belongs to the admin's hospital before creating.
    """
    hospital_id = admin.hospital_id
    bed_id = f"bed-{uuid.uuid4().hex[:10]}"

    if not pool:
        return BedResponse(
            id=bed_id, department_id=body.department_id,
            bedType=body.bed_type, total=body.total,
            occupied=0, available=body.total, floorWard=body.floor_ward
        )

    async with pool.acquire() as conn:
        # Hospital isolation: verify department belongs to admin's hospital
        dept = await conn.fetchrow(
            "SELECT id FROM hospital_departments WHERE id = $1 AND hospital_id = $2",
            body.department_id, hospital_id
        )
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found.")

        await conn.execute("""
            INSERT INTO department_beds (id, department_id, bed_type, total, occupied, available, floor_ward)
            VALUES ($1, $2, $3, $4, 0, $4, $5)
        """, bed_id, body.department_id, body.bed_type, body.total, body.floor_ward)

        now_time = datetime.now().strftime("%I:%M %p")
        await conn.execute("""
            INSERT INTO hospital_activity_logs (id, hospital_id, time, message, category)
            VALUES ($1, $2, $3, $4, 'bed')
        """, f"act-{uuid.uuid4().hex[:8]}", hospital_id, now_time,
            f"New bed type '{body.bed_type}' added ({body.total} beds) to department")

        return BedResponse(
            id=bed_id, department_id=body.department_id,
            bedType=body.bed_type, total=body.total,
            occupied=0, available=body.total, floorWard=body.floor_ward
        )


# ─── Ambulance Management Endpoints ──────────────────────────────────────────

class AmbulanceResponse(BaseModel):
    id: str
    hospital_id: str
    ambulance_number: str
    ambulance_type: str
    driver_name: str
    driver_phone: str
    status: str
    current_location: str


class NewAmbulanceRequest(BaseModel):
    ambulance_number: str
    ambulance_type: Optional[str] = "ALS (Advanced Life Support)"
    driver_name: str
    driver_phone: str
    current_location: Optional[str] = "Hospital ER Bay"


class AmbulanceStatusUpdate(BaseModel):
    status: Literal["AVAILABLE", "DISPATCHED", "MAINTENANCE", "OFF DUTY"]
    current_location: Optional[str] = None


@router.get("/ambulances", response_model=List[AmbulanceResponse], summary="List all ambulances in hospital fleet")
async def list_hospital_ambulances(
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    hospital_id = admin.hospital_id
    if not pool:
        return []

    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT * FROM hospital_ambulances
            WHERE hospital_id = $1
            ORDER BY created_at ASC
        """, hospital_id)

        return [
            AmbulanceResponse(
                id=r["id"],
                hospital_id=r["hospital_id"],
                ambulance_number=r["ambulance_number"],
                ambulance_type=r["ambulance_type"],
                driver_name=r["driver_name"],
                driver_phone=r["driver_phone"],
                status=r["status"],
                current_location=r["current_location"] or "ER Bay"
            )
            for r in rows
        ]


@router.post("/ambulances", response_model=AmbulanceResponse, summary="Register a new ambulance to hospital fleet")
async def create_hospital_ambulance(
    body: NewAmbulanceRequest,
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    hospital_id = admin.hospital_id
    amb_id = f"amb-{uuid.uuid4().hex[:8]}"

    if not pool:
        return AmbulanceResponse(
            id=amb_id,
            hospital_id=hospital_id,
            ambulance_number=body.ambulance_number,
            ambulance_type=body.ambulance_type or "ALS",
            driver_name=body.driver_name,
            driver_phone=body.driver_phone,
            status="AVAILABLE",
            current_location=body.current_location or "Hospital Bay"
        )

    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO hospital_ambulances (id, hospital_id, ambulance_number, ambulance_type, driver_name, driver_phone, status, current_location)
            VALUES ($1, $2, $3, $4, $5, $6, 'AVAILABLE', $7)
        """, amb_id, hospital_id, body.ambulance_number, body.ambulance_type or "ALS", body.driver_name, body.driver_phone, body.current_location or "Hospital Bay")

        now_time = datetime.now().strftime("%I:%M %p")
        await conn.execute("""
            INSERT INTO hospital_activity_logs (id, hospital_id, time, message, category)
            VALUES ($1, $2, $3, $4, 'emergency')
        """, f"act-{uuid.uuid4().hex[:8]}", hospital_id, now_time,
            f"Ambulance unit {body.ambulance_number} ({body.driver_name}) registered to fleet.")

        return AmbulanceResponse(
            id=amb_id,
            hospital_id=hospital_id,
            ambulance_number=body.ambulance_number,
            ambulance_type=body.ambulance_type or "ALS",
            driver_name=body.driver_name,
            driver_phone=body.driver_phone,
            status="AVAILABLE",
            current_location=body.current_location or "Hospital Bay"
        )


@router.put("/ambulances/{ambulance_id}/status", response_model=AmbulanceResponse, summary="Update ambulance status or driver location")
async def update_ambulance_status(
    ambulance_id: str,
    body: AmbulanceStatusUpdate,
    admin: AdminContext = Depends(get_admin_context),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    hospital_id = admin.hospital_id

    if not pool:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    async with pool.acquire() as conn:
        amb = await conn.fetchrow(
            "SELECT * FROM hospital_ambulances WHERE id = $1 AND hospital_id = $2",
            ambulance_id, hospital_id
        )
        if not amb:
            raise HTTPException(status_code=404, detail="Ambulance not found in this hospital fleet")

        loc = body.current_location if body.current_location is not None else amb["current_location"]
        await conn.execute("""
            UPDATE hospital_ambulances
            SET status = $1, current_location = $2
            WHERE id = $3
        """, body.status, loc, ambulance_id)

        now_time = datetime.now().strftime("%I:%M %p")
        await conn.execute("""
            INSERT INTO hospital_activity_logs (id, hospital_id, time, message, category)
            VALUES ($1, $2, $3, $4, 'emergency')
        """, f"act-{uuid.uuid4().hex[:8]}", hospital_id, now_time,
            f"Ambulance {amb['ambulance_number']} status changed to {body.status}.")

        updated = await conn.fetchrow("SELECT * FROM hospital_ambulances WHERE id = $1", ambulance_id)
        return AmbulanceResponse(
            id=updated["id"],
            hospital_id=updated["hospital_id"],
            ambulance_number=updated["ambulance_number"],
            ambulance_type=updated["ambulance_type"],
            driver_name=updated["driver_name"],
            driver_phone=updated["driver_phone"],
            status=updated["status"],
            current_location=updated["current_location"] or "Hospital Bay"
        )
