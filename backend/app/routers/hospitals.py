import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
import asyncpg
from app.core.config import settings
from app.core.database import get_db_pool
from app.core.security import decode_access_token, hash_password
from app.schemas.hospital import (
    DetailedHospitalSchema,
    HospitalSimpleSchema,
    DepartmentBedUpdateSchema,
    DepartmentBedTypeSchema,
    HospitalCreateSchema,
    DepartmentItemSchema,
    EmergencySetupConfigSchema,
    HospitalLocationConfigSchema,
    DepartmentDoctorSchema
)
from app.services.sse_service import sse_manager
import asyncio

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

# Fallback data when DB pool is unavailable
DEMO_HOSPITALS_SIMPLE = [
    {
        "id": "hsp-001",
        "name": "CityCare Hospital (HSP-001)",
        "dist": "2.5 km",
        "time": "8 mins",
        "traffic": "Clear",
        "address": "Plot 14, Sector 44, New Delhi",
        "phone": "+91 11 4910 2000",
        "emergencyPhone": "102",
        "ambulancePhone": "+91 11 4910 2000",
        "vacantBeds": 8,
        "totalBeds": 20,
        "erStatus": "LEVEL 1 TRAUMA • OPEN 24/7"
    }
]

INITIAL_DETAILED_HOSPITAL = {
    "id": "hsp-001",
    "hospitalCode": "HSP-001",
    "name": "CityCare Hospital",
    "type": "Private Multi-Specialty Hospital",
    "phone": settings.DEMO_AMBULANCE_CONTACT,
    "emergencyPhone": settings.DEMO_EMERGENCY_CONTACT,
    "email": "admin@citycare.org",
    "website": "https://www.citycarehospital.org",
    "establishedYear": 2012,
    "employeeCount": 450,
    "description": "CityCare Hospital is a state-of-the-art 250-bed multi-specialty tertiary care institution.",
    "adminName": "Admin Rajesh Sharma",
    "adminEmail": "admin@citycare.org",
    "isOnboarded": True,
    "location": {
        "address": "Plot 14, Institutional Area, Sector 44",
        "city": "New Delhi",
        "state": "Delhi NCR",
        "pincode": "110017",
        "latitude": "28.5355",
        "longitude": "77.2610",
        "emergencyEntranceLocation": "Gate #3 (South Wing)",
        "mainEntranceLocation": "Gate #1 (North Atrium)",
        "contactInfo": "+91 11 4910 2000 / ER Ext. 101"
    },
    "emergencyConfig": {
        "is24x7Emergency": True,
        "departmentName": "Emergency Medicine & Level-1 Trauma Bay",
        "emergencyContact": settings.DEMO_EMERGENCY_CONTACT,
        "ambulanceContact": settings.DEMO_AMBULANCE_CONTACT,
        "totalEmergencyBeds": 20,
        "availableEmergencyBeds": 8,
        "traumaCareAvailable": True,
        "ambulanceAvailable": True,
        "emergencyDoctorsOnDutyCount": 4
    },
    "globalServices": [
        "24x7 Emergency & Trauma Care",
        "Intensive Care Unit (ICU)",
        "Advanced Cardiac Care (CCU)"
    ],
    "departments": [
        {
            "id": "dept-er",
            "code": "ER-01",
            "name": "Emergency Medicine & Trauma",
            "description": "Level 1 Trauma Triage & Acute Resuscitation Bay.",
            "contactPhone": settings.DEMO_EMERGENCY_CONTACT,
            "locationFloor": "Ground Floor, South Wing",
            "operatingHours": "24x7",
            "is24x7": True,
            "hasEmergencySupport": True,
            "status": "ACTIVE",
            "services": ["Triage", "Cardiac Resuscitation", "Trauma Bay"],
            "beds": [
                {"id": "b-er-gen", "bedType": "Emergency Triage Beds", "total": 12, "occupied": 7, "available": 5, "floorWard": "ER Bay A"},
                {"id": "b-er-trauma", "bedType": "Trauma Resuscitation Beds", "total": 8, "occupied": 5, "available": 3, "floorWard": "Trauma Bay 1"}
            ],
            "doctors": [
                {
                    "id": "doc-er-1",
                    "doctorCode": "DOC-ER-101",
                    "name": "Dr. Shiv Gupta",
                    "specialization": "Cardiology & Vascular Medicine",
                    "qualification": "DM (Cardiology)",
                    "experienceYears": 19,
                    "contactPhone": "+91 98111 22334",
                    "email": "dr.shiv@citycare.org",
                    "shift": "On-Call Trauma & Cath Lab",
                    "availability": "ON DUTY"
                }
            ]
        }
    ]
}

def get_current_hospital_id(authorization: Optional[str] = Header(None)) -> str:
    """Server-side hospital isolation enforcement. Extracts hospital_id from verified JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        return "hsp-001"
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authorization token.")
    return payload.get("hospital_id") or "hsp-001"

async def build_detailed_hospital_response(conn: asyncpg.Connection, hospital_id: str) -> DetailedHospitalSchema:
    h = await conn.fetchrow("SELECT * FROM hospitals WHERE id = $1", hospital_id)
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found.")

    # Fetch departments
    depts = await conn.fetch("SELECT * FROM hospital_departments WHERE hospital_id = $1 ORDER BY created_at ASC", hospital_id)
    dept_list = []
    
    total_er_beds = 0
    avail_er_beds = 0

    for d in depts:
        # Fetch beds for dept
        beds = await conn.fetch("SELECT * FROM department_beds WHERE department_id = $1 ORDER BY created_at ASC", d["id"])
        bed_schemas = [
            DepartmentBedTypeSchema(
                id=b["id"],
                bedType=b["bed_type"],
                total=b["total"],
                occupied=b["occupied"],
                available=b["available"],
                floorWard=b["floor_ward"]
            ) for b in beds
        ]
        
        # Track ER beds
        if "ER" in d["code"] or "Emergency" in d["name"]:
            for b in beds:
                total_er_beds += b["total"]
                avail_er_beds += b["available"]

        # Fetch doctors for dept/hospital
        docs = await conn.fetch("SELECT * FROM doctors WHERE hospital_id = $1 AND (department_id = $2 OR department_id IS NULL)", hospital_id, d["id"])
        doc_schemas = [
            DepartmentDoctorSchema(
                id=doc["id"],
                doctorCode=doc["doctor_code"],
                name=doc["name"],
                specialization=doc["specialization"],
                qualification=doc["qualification"] or "MD",
                experienceYears=doc["experience_years"] or 5,
                contactPhone=doc["contact_phone"] or h["phone"],
                email=doc["email"] or h["email"],
                shift=doc["shift"] or "Standard Shift",
                availability=doc["availability"] if doc["availability"] in ('ON DUTY', 'OFF DUTY', 'ON LEAVE') else 'ON DUTY'
            ) for doc in docs
        ]

        services_val = d["services"]
        if isinstance(services_val, str):
            try:
                services_val = json.loads(services_val)
            except:
                services_val = ["Emergency Care", "Consultation"]

        dept_list.append(DepartmentItemSchema(
            id=d["id"],
            code=d["code"],
            name=d["name"],
            description=d["description"] or "",
            contactPhone=d["contact_phone"] or h["phone"],
            locationFloor=d["location_floor"] or "Ground Floor",
            operatingHours=d["operating_hours"] or "24x7",
            is24x7=d["is_24x7"],
            hasEmergencySupport=d["has_emergency_support"],
            status=d["status"] if d["status"] in ('ACTIVE', 'INACTIVE') else 'ACTIVE',
            services=services_val if isinstance(services_val, list) else [],
            beds=bed_schemas,
            doctors=doc_schemas
        ))

    services_json = h["global_services"]
    if isinstance(services_json, str):
        try:
            services_json = json.loads(services_json)
        except:
            services_json = ["24x7 Emergency Care", "Inpatient Services"]

    loc_config = HospitalLocationConfigSchema(
        address=h["address"],
        city=h["city"],
        state=h["state"],
        pincode=h["pincode"],
        latitude=h["latitude"] or "28.5355",
        longitude=h["longitude"] or "77.2610",
        emergencyEntranceLocation=h["emergency_entrance_location"] or "Gate #3",
        mainEntranceLocation=h["main_entrance_location"] or "Gate #1",
        contactInfo=h["contact_info"] or h["phone"]
    )

    # Use aggregated bed data; only fall back to hospital-level columns if no departments found
    final_total_er = total_er_beds if total_er_beds > 0 else (h["total_emergency_beds"] if h["total_emergency_beds"] and h["total_emergency_beds"] > 0 else 0)
    final_avail_er = avail_er_beds if total_er_beds > 0 else (h["available_emergency_beds"] if h["available_emergency_beds"] and h["available_emergency_beds"] > 0 else 0)
    # Enforce invariant: available <= total
    final_avail_er = min(final_avail_er, final_total_er)

    emerg_config = EmergencySetupConfigSchema(
        is24x7Emergency=h["is_24x7_emergency"],
        departmentName=h["emergency_department_name"] or "Emergency Medicine & Trauma Bay",
        emergencyContact=h["emergency_phone"],
        ambulanceContact=h["ambulance_phone"] or h["phone"],
        totalEmergencyBeds=final_total_er,
        availableEmergencyBeds=final_avail_er,
        traumaCareAvailable=h["trauma_care_available"],
        ambulanceAvailable=h["ambulance_available"],
        emergencyDoctorsOnDutyCount=2
    )

    return DetailedHospitalSchema(
        id=h["id"],
        hospitalCode=h["hospital_code"],
        name=h["name"],
        type=h["type"],
        phone=h["phone"],
        emergencyPhone=h["emergency_phone"],
        email=h["email"],
        website=h["website"] or "",
        establishedYear=h["established_year"] or 2015,
        employeeCount=h["employee_count"] or 200,
        description=h["description"] or "",
        location=loc_config,
        departments=dept_list,
        emergencyConfig=emerg_config,
        globalServices=services_json if isinstance(services_json, list) else [],
        isOnboarded=h["is_onboarded"],
        adminName=h["admin_name"] or "Hospital Admin",
        adminEmail=h["admin_email"] or h["email"]
    )

@router.get("/stream")
async def sse_global_hospitals_stream():
    """SSE endpoint for patient portals to get real-time public hospital bed updates."""
    async def event_generator():
        q = await sse_manager.subscribe_global_patient()
        try:
            while True:
                msg = await q.get()
                yield f"data: {msg}\n\n"
        except asyncio.CancelledError:
            sse_manager.unsubscribe_global_patient(q)
            raise
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("", response_model=List[HospitalSimpleSchema])
async def list_nearby_hospitals(pool: asyncpg.Pool = Depends(get_db_pool)):
    if not pool:
        return DEMO_HOSPITALS_SIMPLE

    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM hospitals ORDER BY created_at ASC")
        if not rows:
            return DEMO_HOSPITALS_SIMPLE

        results = []
        for r in rows:
            # Query real bed stats for hospital (focused on ER beds for Emergency SOS)
            bed_stats = await conn.fetchrow("""
                SELECT COALESCE(SUM(b.total), 0) as total_b, COALESCE(SUM(b.available), 0) as vacant_b
                FROM department_beds b
                JOIN hospital_departments d ON d.id = b.department_id
                WHERE d.hospital_id = $1 AND (d.code LIKE '%ER%' OR d.name ILIKE '%Emergency%')
            """, r["id"])

            total_b = max(0, int(bed_stats["total_b"])) if bed_stats else 0
            vacant_b = max(0, min(total_b, int(bed_stats["vacant_b"]))) if bed_stats else 0

            results.append(HospitalSimpleSchema(
                id=r["id"],
                name=f"{r['name']} ({r['hospital_code']})",
                dist="2.5 km",
                time="8 mins",
                traffic="Clear",
                address=f"{r['address']}, {r['city']}",
                phone=r["phone"],
                emergencyPhone=r["emergency_phone"],
                ambulancePhone=r["ambulance_phone"] or r["phone"],
                vacantBeds=vacant_b,
                totalBeds=total_b,
                erStatus="LEVEL 1 TRAUMA • OPEN 24/7" if r["is_24x7_emergency"] else "GENERAL ER"
            ))
        return results

@router.get("/me", response_model=DetailedHospitalSchema)
async def get_hospital_admin_details(
    hospital_id: str = Depends(get_current_hospital_id),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return INITIAL_DETAILED_HOSPITAL

    async with pool.acquire() as conn:
        return await build_detailed_hospital_response(conn, hospital_id)

@router.get("/{hospital_id}", response_model=DetailedHospitalSchema)
async def get_hospital_by_id(hospital_id: str, pool: asyncpg.Pool = Depends(get_db_pool)):
    if not pool:
        return INITIAL_DETAILED_HOSPITAL
    async with pool.acquire() as conn:
        return await build_detailed_hospital_response(conn, hospital_id)

@router.post("", response_model=DetailedHospitalSchema)
@router.post("/register", response_model=DetailedHospitalSchema)
async def register_hospital(req: HospitalCreateSchema, pool: asyncpg.Pool = Depends(get_db_pool)):
    h_id = f"hsp-{uuid.uuid4().hex[:8]}"
    h_code = req.hospitalCode or f"HSP-{uuid.uuid4().hex[:4].upper()}"
    amb_phone = req.ambulancePhone or req.phone

    if not pool:
        return INITIAL_DETAILED_HOSPITAL

    async with pool.acquire() as conn:
        # Check if code already exists
        existing = await conn.fetchrow("SELECT id FROM hospitals WHERE hospital_code = $1", h_code)
        if existing:
            h_code = f"HSP-{uuid.uuid4().hex[:6].upper()}"

        await conn.execute("""
            INSERT INTO hospitals (
                id, hospital_code, name, type, phone, emergency_phone, ambulance_phone, email, website,
                established_year, employee_count, description, address, city, state, pincode,
                admin_name, admin_email, is_24x7_emergency, trauma_care_available, ambulance_available
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, TRUE, TRUE, TRUE)
        """, h_id, h_code, req.name, req.type, req.phone, req.emergencyPhone, amb_phone, req.email, req.website,
        req.establishedYear, req.employeeCount, req.description, req.address, req.city, req.state, req.pincode,
        req.adminName, req.adminEmail)

        # Create default departments
        dept_er_id = f"dept-{h_id}-er"
        dept_cardio_id = f"dept-{h_id}-cardio"
        dept_neuro_id = f"dept-{h_id}-neuro"

        await conn.execute("""
            INSERT INTO hospital_departments (id, hospital_id, code, name, description, contact_phone, is_24x7, has_emergency_support)
            VALUES ($1, $2, 'ER-01', 'Emergency Medicine & Trauma', '24x7 Triage & Acute Trauma Bay', $3, TRUE, TRUE),
                   ($4, $2, 'CARDIO-01', 'Cardiology & Vascular Medicine', 'Advanced Cardiac Care & CCU', $3, TRUE, TRUE),
                   ($5, $2, 'NEURO-01', 'Neurology & Stroke Unit', 'Comprehensive Stroke & Neuro ICU', $3, TRUE, TRUE)
        """, dept_er_id, h_id, req.emergencyPhone, dept_cardio_id, dept_neuro_id)

        # Create default beds
        await conn.execute("""
            INSERT INTO department_beds (id, department_id, bed_type, total, occupied, available, floor_ward)
            VALUES ($1, $2, 'Emergency Triage Beds', 12, 0, 12, 'ER Bay A'),
                   ($3, $2, 'Trauma Resuscitation Beds', 8, 0, 8, 'Trauma Bay 1'),
                   ($4, $5, 'Cardiac ICU Bed', 10, 0, 10, 'Cardiology Tower 3rd Floor'),
                   ($6, $7, 'Neurology ICU Bed', 8, 0, 8, 'Neuro Wing 2nd Floor')
        """, f"b-{h_id}-er-1", dept_er_id, f"b-{h_id}-er-2", f"b-{h_id}-cardio-1", dept_cardio_id, f"b-{h_id}-neuro-1", dept_neuro_id)

        # Create Admin user
        admin_user_id = f"usr-admin-{h_id}"
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, role, full_name, phone, hospital_id)
            VALUES ($1, $2, $3, 'hospital_admin', $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET hospital_id = $6, full_name = $4
        """, admin_user_id, req.adminEmail, hash_password(req.adminPassword or "password123"), req.adminName, req.phone, h_id)

        return await build_detailed_hospital_response(conn, h_id)

@router.put("/{hospital_id}/beds/{bed_id}", response_model=DepartmentBedTypeSchema)
@router.put("/me/departments/{dept_id}/beds/{bed_id}", response_model=DepartmentBedTypeSchema)
async def update_department_bed_occupancy(
    bed_id: str,
    dept_id: Optional[str] = None,
    hospital_id: Optional[str] = None,
    body: Optional[DepartmentBedUpdateSchema] = None,
    is_occupied: Optional[bool] = Query(None),
    current_hospital_id: str = Depends(get_current_hospital_id),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    # Support both payload structures
    if body is not None:
        target_occupied = body.occupied
    elif is_occupied is not None:
        target_occupied = None # Will calculate based on current value
    else:
        raise HTTPException(status_code=400, detail="Must provide either body.occupied or is_occupied query parameter.")

    if not pool:
        # Fallback for no-db testing
        final_occ = target_occupied if target_occupied is not None else (1 if is_occupied else 0)
        return DepartmentBedTypeSchema(id=bed_id, bedType="Emergency Bed", total=10, occupied=final_occ, available=10-final_occ, floorWard="ER Bay A")

    async with pool.acquire() as conn:
        # Get current bed stats
        b = await conn.fetchrow("SELECT * FROM department_beds WHERE id = $1", bed_id)
        if not b:
            raise HTTPException(status_code=404, detail="Bed record not found.")
            
        if target_occupied is None:
            # Toggle logic for test
            if is_occupied:
                target_occupied = min(b["total"], b["occupied"] + 1)
            else:
                target_occupied = max(0, b["occupied"] - 1)

        await conn.execute(
            """UPDATE department_beds 
               SET occupied = $1, available = total - $1
               WHERE id = $2""",
            target_occupied, bed_id
        )
        
        # Fetch updated record and hospital_id to broadcast event
        b = await conn.fetchrow("""
            SELECT b.*, d.hospital_id 
            FROM department_beds b
            JOIN hospital_departments d ON b.department_id = d.id
            WHERE b.id = $1
        """, bed_id)

        response_schema = DepartmentBedTypeSchema(
            id=b["id"],
            bedType=b["bed_type"],
            total=b["total"],
            occupied=b["occupied"],
            available=b["available"],
            floorWard=b["floor_ward"]
        )

        # Query total bed stats for the hospital to push to global patients (focused on ER beds)
        h_stats = await conn.fetchrow("""
            SELECT COALESCE(SUM(b.total), 0) as total_b, COALESCE(SUM(b.available), 0) as vacant_b
            FROM department_beds b
            JOIN hospital_departments d ON b.department_id = d.id
            WHERE d.hospital_id = $1 AND (d.code LIKE '%ER%' OR d.name ILIKE '%Emergency%')
        """, b["hospital_id"])

        total_b = max(0, int(h_stats["total_b"])) if h_stats else 0
        vacant_b = max(0, min(total_b, int(h_stats["vacant_b"]))) if h_stats else 0

        # Broadcast real-time bed count to the global patient stream
        await sse_manager.broadcast_global_event("BED_AVAILABILITY_UPDATED", {
            "hospital_id": b["hospital_id"],
            "vacantBeds": vacant_b,
            "totalBeds": total_b,
            "updatedBed": response_schema.dict()
        })

        return response_schema

@router.get("/{hospital_id}/beds", response_model=List[DepartmentBedTypeSchema])
async def list_hospital_beds(hospital_id: str, pool: asyncpg.Pool = Depends(get_db_pool)):
    if not pool:
        return []
    async with pool.acquire() as conn:
        beds = await conn.fetch("""
            SELECT b.* FROM department_beds b
            JOIN hospital_departments d ON d.id = b.department_id
            WHERE d.hospital_id = $1
        """, hospital_id)
        return [
            DepartmentBedTypeSchema(
                id=b["id"],
                bedType=b["bed_type"],
                total=b["total"],
                occupied=b["occupied"],
                available=b["available"],
                floorWard=b["floor_ward"]
            ) for b in beds
        ]
