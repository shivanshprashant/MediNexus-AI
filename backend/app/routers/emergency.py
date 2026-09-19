import uuid
import json
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Request, Header
import asyncpg
from app.core.config import settings
from app.core.database import get_db_pool
from app.schemas.emergency import (
    EmergencySOSCreateRequest,
    EmergencyRequestSchema,
    EmergencyStatusUpdate
)
from app.services.llm_interface import analyze_symptom_with_llm
from app.services.sse_service import sse_manager
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/emergency", tags=["Emergency / SOS"])

@router.post("/sos", response_model=EmergencyRequestSchema)
async def trigger_emergency_sos(
    req: EmergencySOSCreateRequest,
    authorization: Optional[str] = Header(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    emergency_id = f"emg-{uuid.uuid4().hex[:8]}"
    now = datetime.now()
    time_str = now.strftime("%I:%M %p")
    ts_str = f"Today, {time_str}"
    
    # Run symptom analysis via Shivansh Gupta's LLM contract interface boundary
    ai_res = await analyze_symptom_with_llm(req.complaint or "Acute emergency symptom presentation")
    
    hospital_id = req.target_hospital_id or "hsp-001"
    if hospital_id in ["hosp-1", "hosp-001"]:
        hospital_id = "hsp-001"

    # Default patient info
    patient_id = req.patient_id or "p-demo-ananya"
    patient_name = req.patient_name or "Ananya Sharma"
    age_gender = req.age_gender or "29 / Female"
    med_info = req.medical_info or "Allergies: Penicillin, Sulfa Drugs | Chronic: Asthma | Blood: O+"

    if pool:
        async with pool.acquire() as conn:
            # Ensure valid hospital_id exists in database
            hosp_exists = await conn.fetchval("SELECT id FROM hospitals WHERE id = $1", hospital_id)
            if not hosp_exists:
                fallback_hosp = await conn.fetchval("SELECT id FROM hospitals LIMIT 1")
                hospital_id = fallback_hosp or "hsp-001"

            resolved_patient = None

            # 1. Prioritize direct patient_id if provided
            if req.patient_id:
                resolved_patient = await conn.fetchrow(
                    "SELECT * FROM patients WHERE id = $1 OR user_id = $1", req.patient_id
                )

            # 2. Prioritize patient_name if provided and not yet found
            if not resolved_patient and req.patient_name and req.patient_name.lower() not in ["patient", "ananya sharma"]:
                resolved_patient = await conn.fetchrow(
                    "SELECT * FROM patients WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT 1",
                    f"%{req.patient_name.strip()}%"
                )

            # 3. Try to resolve patient from authorization header if present
            if not resolved_patient and authorization and authorization.startswith("Bearer "):
                from app.core.security import decode_access_token
                tok = authorization.split(" ")[1]
                payload = decode_access_token(tok)
                if payload and "sub" in payload:
                    sub = payload["sub"]
                    resolved_patient = await conn.fetchrow(
                        "SELECT * FROM patients WHERE user_id = $1 OR id = $1", sub
                    )
            
            # 4. If no explicit name/token and still not resolved, fallback to demo patient
            if not resolved_patient:
                if not req.patient_name or req.patient_name.lower() in ["patient", "ananya sharma"]:
                    resolved_patient = await conn.fetchrow(
                        "SELECT * FROM patients WHERE id = 'p-demo-ananya' OR user_id = 'usr-demo-patient' LIMIT 1"
                    )
                    if not resolved_patient:
                        resolved_patient = await conn.fetchrow("SELECT * FROM patients LIMIT 1")

            if resolved_patient:
                patient_id = resolved_patient["id"]
                patient_name = resolved_patient["name"] or patient_name
                age = resolved_patient["age"] or (req.age_gender.split('/')[0].strip() if req.age_gender else 29)
                gender = resolved_patient["gender"] or (req.age_gender.split('/')[1].strip() if req.age_gender and '/' in req.age_gender else "Female")
                age_gender = f"{age} / {gender}"
                allergies = resolved_patient.get("allergies") or "None"
                meds = resolved_patient.get("meds") or "None"
                blood = resolved_patient.get("blood") or "O+"
                med_info = f"Allergies: {allergies} | Meds: {meds} | Blood: {blood}"
            elif req.patient_name:
                # Patient not found in DB but explicit name passed
                patient_name = req.patient_name
                if req.age_gender:
                    age_gender = req.age_gender
                if req.medical_info:
                    med_info = req.medical_info
    
    # Default ambulance details if ambulance mode
    amb_number = req.ambulance_number
    driver_name = req.driver_name
    driver_phone = req.driver_phone
    amb_type = req.ambulance_type or ("ALS (Advanced Life Support)" if req.mode == "ambulance" else None)

    # Resolve patient location
    patient_loc = req.patient_location
    patient_lat = req.patient_latitude
    patient_lng = req.patient_longitude

    if not patient_loc:
        if patient_lat and patient_lng:
            patient_loc = f"GPS: {patient_lat:.4f}, {patient_lng:.4f}"
        else:
            patient_loc = "B-42, Sector 62, Noida, Uttar Pradesh 201309"
            patient_lat = 28.6280
            patient_lng = 77.3649

    if patient_lat and patient_lng:
        maps_link = f"https://www.google.com/maps/dir/?api=1&destination={patient_lat},{patient_lng}"
    else:
        from urllib.parse import quote
        maps_link = f"https://www.google.com/maps/dir/?api=1&destination={quote(patient_loc)}"

    if pool and req.mode == "ambulance" and not amb_number:
        async with pool.acquire() as conn:
            # Pick an available ambulance from hospital fleet if exists
            amb_row = await conn.fetchrow(
                "SELECT * FROM hospital_ambulances WHERE hospital_id = $1 AND status = 'AVAILABLE' LIMIT 1",
                hospital_id
            )
            if amb_row:
                amb_number = amb_row["ambulance_number"]
                driver_name = amb_row["driver_name"]
                driver_phone = amb_row["driver_phone"]
                amb_type = amb_row["ambulance_type"]
            else:
                amb_number = "DL-01-AMB-402"
                driver_name = "Rajesh Kumar"
                driver_phone = "+91 83039 36384"
                amb_type = "ALS (Advanced Life Support)"

    request_data = {
        "id": emergency_id,
        "patientId": patient_id,
        "patientName": patient_name,
        "ageGender": age_gender,
        "severity": ai_res.get("severity", "HIGH"),
        "requiredCare": ai_res.get("required_care", "Cardiology & Vascular Medicine"),
        "requestTime": time_str,
        "timestamp": ts_str,
        "status": "HOSPITAL NOTIFIED",
        "complaint": req.complaint or "Acute chest discomfort",
        "aiAssessment": f"AI Triage: {ai_res.get('severity')} Severity. Care Pathway: {ai_res.get('required_care')}",
        "aiRecommendation": ai_res.get("recommendation", "Immediate resting & STAT ECG recommended."),
        "aiSummary": ai_res.get("ai_summary", "Patient presented with acute symptoms requiring immediate triage."),
        "medicalInfo": med_info,
        "allocatedBed": None,
        "emergencyContact": settings.DEMO_EMERGENCY_CONTACT,
        "ambulanceContact": driver_phone or settings.DEMO_AMBULANCE_CONTACT,
        "mode": req.mode,
        "ambulanceNumber": amb_number,
        "driverName": driver_name,
        "driverPhone": driver_phone,
        "ambulanceType": amb_type,
        "patientLocation": patient_loc,
        "patientLatitude": patient_lat,
        "patientLongitude": patient_lng,
        "mapsLink": maps_link,
    }
    
    if pool:
        async with pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO emergency_requests 
                   (id, patient_id, hospital_id, patient_name, age_gender, request_time, timestamp, mode, severity, required_care, status, complaint, ai_assessment, ai_recommendation, ai_summary, medical_info, allocated_bed, ambulance_number, driver_name, driver_phone, ambulance_type, patient_location, patient_latitude, patient_longitude, maps_link)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)""",
                emergency_id,
                patient_id,
                hospital_id,
                request_data["patientName"],
                request_data["ageGender"],
                request_data["requestTime"],
                request_data["timestamp"],
                req.mode,
                request_data["severity"],
                request_data["requiredCare"],
                request_data["status"],
                request_data["complaint"],
                request_data["aiAssessment"],
                request_data["aiRecommendation"],
                request_data["aiSummary"],
                request_data["medicalInfo"],
                None,
                amb_number,
                driver_name,
                driver_phone,
                amb_type,
                patient_loc,
                patient_lat,
                patient_lng,
                maps_link
            )
            
            # Record hospital activity log
            await conn.execute(
                """INSERT INTO hospital_activity_logs (id, hospital_id, time, message, category)
                   VALUES ($1, $2, $3, $4, 'emergency')""",
                f"act-{uuid.uuid4().hex[:8]}",
                hospital_id,
                time_str,
                f"Emergency SOS triggered by {request_data['patientName']} - Mode: {req.mode.upper()}{f' (Ambulance: {amb_number})' if amb_number else ''} Location: {patient_loc}"
            )
            
    # Broadcast realtime SSE event to subscribed hospital admin dashboard
    await sse_manager.broadcast_hospital_event(hospital_id, "EMERGENCY_SOS", request_data)
    
    return EmergencyRequestSchema(**request_data)

@router.get("/requests", response_model=List[EmergencyRequestSchema])
async def list_emergency_requests(
    hospital_id: Optional[str] = Query("hsp-001"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return [
            EmergencyRequestSchema(
                id="emg-001",
                patientId="pt-demo-01",
                patientName="Ananya Sharma",
                ageGender="29 / Female",
                severity="HIGH",
                requiredCare="Cardiology & Vascular Medicine",
                requestTime="02:14 PM",
                timestamp="Today, 02:14 PM",
                status="HOSPITAL NOTIFIED",
                complaint="Severe chest tightness radiating to left arm",
                aiAssessment="Triage Score: 8/10. High risk for Acute Coronary Syndrome.",
                aiRecommendation="Prepare STAT ECG and notify On-Duty Cardiologist immediately.",
                aiSummary="29yo F presenting with acute precordial chest pain.",
                medicalInfo="Allergies: Penicillin | Chronic: Asthma | Blood: O+",
                emergencyContact=settings.DEMO_EMERGENCY_CONTACT,
                ambulanceContact=settings.DEMO_AMBULANCE_CONTACT
            )
        ]
        
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT e.*, e.patient_name as e_patient_name, p.name as p_name, p.age, p.dob, p.gender, p.blood, p.allergies, p.meds
               FROM emergency_requests e
               LEFT JOIN patients p ON e.patient_id = p.id
               WHERE e.hospital_id = $1
               ORDER BY e.created_at DESC""",
            hospital_id
        )
        
        def calc_age(dob_str, fallback):
            if not dob_str: return fallback
            try:
                b = datetime.strptime(dob_str, "%Y-%m-%d")
                t = datetime.today()
                return t.year - b.year - ((t.month, t.day) < (b.month, b.day))
            except:
                return fallback

        results = []
        for r in rows:
            calc_a = calc_age(r.get('dob'), r.get('age') or 30)
            patient_name = r.get('p_name') or r.get('e_patient_name') or r.get('patient_name') or "Patient"
            age_gender = f"{calc_a} / {r.get('gender') or 'Female'}" if r.get('gender') else (r.get('age_gender') or f"{calc_a} / Female")
            med_info = r.get('medical_info') or f"Allergies: {r.get('allergies') or 'None'} | Meds: {r.get('meds') or 'None'} | Blood: {r.get('blood') or 'O+'}"
            created_dt = r['created_at']
            time_str = created_dt.strftime("%I:%M %p") if created_dt else "12:00 PM"
            ts_str = f"Today, {time_str}"
            
            results.append(EmergencyRequestSchema(
                id=r['id'],
                patientId=r['patient_id'] or "pt-01",
                patientName=patient_name,
                ageGender=age_gender,
                severity=r['severity'] or "HIGH",
                requiredCare=r['required_care'] or "Emergency Care",
                requestTime=time_str,
                timestamp=ts_str,
                status=r['status'] or "REQUEST CREATED",
                complaint=r['complaint'] or "",
                aiAssessment=r['ai_assessment'] or "",
                aiRecommendation=r['ai_recommendation'] or "",
                aiSummary=r['ai_summary'] or "",
                medicalInfo=med_info,
                allocatedBed=r['allocated_bed'],
                emergencyContact=settings.DEMO_EMERGENCY_CONTACT,
                ambulanceContact=r.get('driver_phone') or settings.DEMO_AMBULANCE_CONTACT,
                redirectedHospitalId=r.get('redirected_hospital_id'),
                redirectedHospitalName=r.get('redirected_hospital_name'),
                redirectedHospitalAddress=r.get('redirected_hospital_address'),
                mode=r.get('mode') or 'drive-in',
                ambulanceNumber=r.get('ambulance_number'),
                driverName=r.get('driver_name'),
                driverPhone=r.get('driver_phone'),
                ambulanceType=r.get('ambulance_type'),
                patientLocation=r.get('patient_location'),
                patientLatitude=r.get('patient_latitude'),
                patientLongitude=r.get('patient_longitude'),
                mapsLink=r.get('maps_link') or (f"https://www.google.com/maps/dir/?api=1&destination={r.get('patient_latitude')},{r.get('patient_longitude')}" if r.get('patient_latitude') else (f"https://www.google.com/maps/dir/?api=1&destination=28.6280,77.3649")),
            ))
        return results

@router.put("/requests/{emergency_id}", response_model=EmergencyRequestSchema)
async def update_emergency_status(
    emergency_id: str,
    body: EmergencyStatusUpdate,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return EmergencyRequestSchema(
            id=emergency_id,
            patientId="pt-demo-01",
            patientName="Ananya Sharma",
            ageGender="29 / Female",
            severity="HIGH",
            requiredCare="Cardiology & Vascular Medicine",
            requestTime="02:14 PM",
            timestamp="Today, 02:14 PM",
            status=body.status,
            complaint="Severe chest tightness radiating to left arm",
            aiAssessment="Triage Score: 8/10. High risk for Acute Coronary Syndrome.",
            aiRecommendation="Prepare STAT ECG and notify On-Duty Cardiologist immediately.",
            aiSummary="29yo F presenting with acute precordial chest pain.",
            medicalInfo="Allergies: Penicillin | Chronic: Asthma | Blood: O+",
            allocatedBed=body.allocatedBed,
            emergencyContact=settings.DEMO_EMERGENCY_CONTACT,
            ambulanceContact=settings.DEMO_AMBULANCE_CONTACT,
            redirectedHospitalId=body.redirectedHospitalId,
            redirectedHospitalName=body.redirectedHospitalName,
            redirectedHospitalAddress=body.redirectedHospitalAddress,
        )
        
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM emergency_requests WHERE id = $1", emergency_id)
        if not row:
            raise HTTPException(status_code=404, detail="Emergency request not found.")
            
        await conn.execute(
            """UPDATE emergency_requests
               SET status = $1, 
                   allocated_bed = COALESCE($2, allocated_bed),
                   redirected_hospital_id = COALESCE($3, redirected_hospital_id),
                   redirected_hospital_name = COALESCE($4, redirected_hospital_name),
                   redirected_hospital_address = COALESCE($5, redirected_hospital_address),
                   updated_at = NOW()
               WHERE id = $6""",
            body.status, 
            body.allocatedBed, 
            body.redirectedHospitalId, 
            body.redirectedHospitalName, 
            body.redirectedHospitalAddress, 
            emergency_id
        )
        
        if body.allocatedBed and body.status == 'ACCEPTED':
            await conn.execute(
                """UPDATE department_beds
                   SET occupied = occupied + 1, available = GREATEST(0, available - 1)
                   WHERE id = (
                       SELECT id FROM department_beds 
                       WHERE department_id IN (SELECT id FROM hospital_departments WHERE hospital_id = $1)
                       ORDER BY available DESC LIMIT 1
                   )""",
                row['hospital_id']
            )
            await conn.execute(
                "UPDATE hospitals SET available_emergency_beds = GREATEST(0, available_emergency_beds - 1) WHERE id = $1",
                row['hospital_id']
            )
            
        # Log update
        now_time = datetime.now().strftime("%I:%M %p")
        await conn.execute(
            """INSERT INTO hospital_activity_logs (id, hospital_id, time, message, category)
               VALUES ($1, $2, $3, $4, 'emergency')""",
            f"act-{uuid.uuid4().hex[:8]}",
            row['hospital_id'],
            now_time,
            f"Emergency {emergency_id} status updated to {body.status}"
        )
        
        # Broadcast via SSE
        await sse_manager.broadcast_hospital_event(
            row['hospital_id'],
            "EMERGENCY_STATUS_UPDATE",
            {
                "emergency_id": emergency_id, 
                "status": body.status, 
                "allocatedBed": body.allocatedBed,
                "redirectedHospitalId": body.redirectedHospitalId,
                "redirectedHospitalName": body.redirectedHospitalName,
                "redirectedHospitalAddress": body.redirectedHospitalAddress,
            }
        )
        
        updated = await conn.fetchrow(
            """SELECT e.*, e.patient_name as e_patient_name, p.name as p_name, p.age, p.dob, p.gender, p.blood, p.allergies, p.meds 
               FROM emergency_requests e 
               LEFT JOIN patients p ON e.patient_id = p.id 
               WHERE e.id = $1""", 
            emergency_id
        )
        
        def calc_age(dob_str, fallback):
            if not dob_str: return fallback
            try:
                b = datetime.strptime(dob_str, "%Y-%m-%d")
                t = datetime.today()
                return t.year - b.year - ((t.month, t.day) < (b.month, b.day))
            except:
                return fallback

        calc_a2 = calc_age(updated.get('dob'), updated.get('age') or 30)
        patient_name = updated.get('p_name') or updated.get('e_patient_name') or updated.get('patient_name') or "Patient"
        age_gender = f"{calc_a2} / {updated.get('gender') or 'Female'}" if updated.get('gender') else (updated.get('age_gender') or f"{calc_a2} / Female")
        med_info = updated.get('medical_info') or f"Allergies: {updated.get('allergies') or 'None'} | Meds: {updated.get('meds') or 'None'} | Blood: {updated.get('blood') or 'O+'}"
        created_dt = updated['created_at']
        time_str = created_dt.strftime("%I:%M %p") if created_dt else "12:00 PM"
        
        return EmergencyRequestSchema(
            id=updated['id'],
            patientId=updated['patient_id'] or "pt-01",
            patientName=patient_name,
            ageGender=age_gender,
            severity=updated['severity'] or "HIGH",
            requiredCare=updated['required_care'] or "Emergency Care",
            requestTime=time_str,
            timestamp=f"Today, {time_str}",
            status=updated['status'],
            complaint=updated['complaint'] or "",
            aiAssessment=updated['ai_assessment'] or "",
            aiRecommendation=updated['ai_recommendation'] or "",
            aiSummary=updated['ai_summary'] or "",
            medicalInfo=med_info,
            allocatedBed=updated['allocated_bed'],
            emergencyContact=settings.DEMO_EMERGENCY_CONTACT,
            ambulanceContact=updated.get('driver_phone') or settings.DEMO_AMBULANCE_CONTACT,
            redirectedHospitalId=updated.get('redirected_hospital_id'),
            redirectedHospitalName=updated.get('redirected_hospital_name'),
            redirectedHospitalAddress=updated.get('redirected_hospital_address'),
            mode=updated.get('mode') or 'drive-in',
            ambulanceNumber=updated.get('ambulance_number'),
            driverName=updated.get('driver_name'),
            driverPhone=updated.get('driver_phone'),
            ambulanceType=updated.get('ambulance_type'),
            patientLocation=updated.get('patient_location'),
            patientLatitude=updated.get('patient_latitude'),
            patientLongitude=updated.get('patient_longitude'),
            mapsLink=updated.get('maps_link') or (f"https://www.google.com/maps/dir/?api=1&destination={updated.get('patient_latitude')},{updated.get('patient_longitude')}" if updated.get('patient_latitude') else (f"https://www.google.com/maps/dir/?api=1&destination=28.6280,77.3649")),
        )

@router.post("/requests/resolve-active")
async def resolve_active_emergencies(
    payload: Optional[dict] = None,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return {"status": "success", "message": "Demo emergencies resolved."}
        
    req_id = payload.get("emergency_id") if payload else None
    patient_id = payload.get("patient_id") if payload else None
    patient_name = payload.get("patient_name") if payload else None
    
    async with pool.acquire() as conn:
        affected = []
        if req_id:
            affected = await conn.fetch("SELECT id, hospital_id FROM emergency_requests WHERE id = $1", req_id)
            await conn.execute(
                "UPDATE emergency_requests SET status = 'RESOLVED', updated_at = NOW() WHERE id = $1",
                req_id
            )
        elif patient_id:
            affected = await conn.fetch(
                "SELECT id, hospital_id FROM emergency_requests WHERE patient_id = $1 AND status NOT IN ('RESOLVED', 'DISCHARGED')",
                patient_id
            )
            await conn.execute(
                "UPDATE emergency_requests SET status = 'RESOLVED', updated_at = NOW() WHERE patient_id = $1 AND status NOT IN ('RESOLVED', 'DISCHARGED')",
                patient_id
            )
        elif patient_name:
            affected = await conn.fetch(
                "SELECT id, hospital_id FROM emergency_requests WHERE patient_name ILIKE $1 AND status NOT IN ('RESOLVED', 'DISCHARGED')",
                f"%{patient_name.strip()}%"
            )
            await conn.execute(
                "UPDATE emergency_requests SET status = 'RESOLVED', updated_at = NOW() WHERE patient_name ILIKE $1 AND status NOT IN ('RESOLVED', 'DISCHARGED')",
                f"%{patient_name.strip()}%"
            )
        else:
            affected = await conn.fetch(
                "SELECT id, hospital_id FROM emergency_requests WHERE status NOT IN ('RESOLVED', 'DISCHARGED')"
            )
            await conn.execute(
                "UPDATE emergency_requests SET status = 'RESOLVED', updated_at = NOW() WHERE status NOT IN ('RESOLVED', 'DISCHARGED')"
            )
            
        # Broadcast to all affected hospitals
        hospitals_to_notify = set()
        for r in affected:
            hosp = r.get("hospital_id") or "hsp-001"
            hospitals_to_notify.add(hosp)
            await sse_manager.broadcast_hospital_event(
                hosp, 
                "EMERGENCY_STATUS_UPDATE", 
                {"emergency_id": r["id"], "status": "RESOLVED"}
            )
            
        for hosp in (hospitals_to_notify or ["hsp-001"]):
            await sse_manager.broadcast_hospital_event(
                hosp, 
                "EMERGENCY_STATUS_UPDATE", 
                {"status": "RESOLVED"}
            )
            
    return {"status": "success", "message": "Active emergency SOS resolved."}

@router.get("/active-sos", response_model=Optional[EmergencyRequestSchema])
async def get_active_emergency(
    patient_id: Optional[str] = None,
    patient_name: Optional[str] = None,
    emergency_id: Optional[str] = None,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return None
        
    async with pool.acquire() as conn:
        row = None
        if emergency_id:
            row = await conn.fetchrow(
                """SELECT e.*, e.patient_name as e_patient_name, p.name as p_name, p.age, p.dob, p.gender, p.blood, p.allergies, p.meds 
                   FROM emergency_requests e 
                   LEFT JOIN patients p ON e.patient_id = p.id 
                   WHERE e.id = $1""", emergency_id
            )
        elif patient_id:
            row = await conn.fetchrow(
                """SELECT e.*, e.patient_name as e_patient_name, p.name as p_name, p.age, p.dob, p.gender, p.blood, p.allergies, p.meds 
                   FROM emergency_requests e 
                   LEFT JOIN patients p ON e.patient_id = p.id 
                   WHERE e.patient_id = $1 AND e.status NOT IN ('RESOLVED', 'DISCHARGED', 'REJECTED')
                   ORDER BY e.created_at DESC LIMIT 1""", patient_id
            )
        elif patient_name:
            row = await conn.fetchrow(
                """SELECT e.*, e.patient_name as e_patient_name, p.name as p_name, p.age, p.dob, p.gender, p.blood, p.allergies, p.meds 
                   FROM emergency_requests e 
                   LEFT JOIN patients p ON e.patient_id = p.id 
                   WHERE (e.patient_name ILIKE $1 OR p.name ILIKE $1) AND e.status NOT IN ('RESOLVED', 'DISCHARGED', 'REJECTED')
                   ORDER BY e.created_at DESC LIMIT 1""", f"%{patient_name.strip()}%"
            )
        else:
            row = await conn.fetchrow(
                """SELECT e.*, e.patient_name as e_patient_name, p.name as p_name, p.age, p.dob, p.gender, p.blood, p.allergies, p.meds 
                   FROM emergency_requests e 
                   LEFT JOIN patients p ON e.patient_id = p.id 
                   WHERE e.status NOT IN ('RESOLVED', 'DISCHARGED', 'REJECTED')
                   ORDER BY e.created_at DESC LIMIT 1"""
            )
            
        if not row:
            return None
            
        def calc_age(dob_str, fallback):
            if not dob_str: return fallback
            try:
                b = datetime.strptime(dob_str, "%Y-%m-%d")
                t = datetime.today()
                return t.year - b.year - ((t.month, t.day) < (b.month, b.day))
            except:
                return fallback

        calc_a = calc_age(row.get('dob'), row.get('age') or 30)
        pname = row.get('p_name') or row.get('e_patient_name') or row.get('patient_name') or "Patient"
        age_gender = f"{calc_a} / {row.get('gender') or 'Female'}" if row.get('gender') else (row.get('age_gender') or f"{calc_a} / Female")
        med_info = row.get('medical_info') or f"Allergies: {row.get('allergies') or 'None'} | Meds: {row.get('meds') or 'None'} | Blood: {row.get('blood') or 'O+'}"
        created_dt = row['created_at']
        time_str = created_dt.strftime("%I:%M %p") if created_dt else "12:00 PM"
        
        return EmergencyRequestSchema(
            id=row['id'],
            patientId=row['patient_id'] or "pt-01",
            patientName=pname,
            ageGender=age_gender,
            severity=row['severity'] or "HIGH",
            requiredCare=row['required_care'] or "Emergency Care",
            requestTime=time_str,
            timestamp=f"Today, {time_str}",
            status=row['status'],
            complaint=row['complaint'] or "",
            aiAssessment=row['ai_assessment'] or "",
            aiRecommendation=row['ai_recommendation'] or "",
            aiSummary=row['ai_summary'] or "",
            medicalInfo=med_info,
            allocatedBed=row['allocated_bed'],
            emergencyContact=settings.DEMO_EMERGENCY_CONTACT,
            ambulanceContact=settings.DEMO_AMBULANCE_CONTACT,
            redirectedHospitalId=row.get('redirected_hospital_id'),
            redirectedHospitalName=row.get('redirected_hospital_name'),
            redirectedHospitalAddress=row.get('redirected_hospital_address'),
        )

@router.get("/stream")
async def sse_emergency_stream(
    request: Request,
    hospital_id: str = Query("hsp-001")
):
    """
    Server-Sent Events (SSE) Stream for real-time emergency room notifications & status updates.
    """
    async def event_generator():
        q = await sse_manager.subscribe_hospital(hospital_id)
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield {"data": data}
                except asyncio.TimeoutError:
                    # Heartbeat keep-alive
                    yield {"event": "ping", "data": "keep-alive"}
        finally:
            sse_manager.unsubscribe_hospital(hospital_id, q)

    return EventSourceResponse(event_generator())
