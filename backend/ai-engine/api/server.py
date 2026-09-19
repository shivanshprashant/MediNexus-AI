import asyncio
import json
import time
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict

from llm.analyzer import analyze_patient, generate_doctor_patient_summary, generate_emergency_doctor_summary
from emergency.safety import validate_emergency_assessment, prescreen_emergency
from pathway.resolver import resolve_pathway
from tools.hospital_tools import find_suitable_hospital
from hospital.mock_data import DEFAULT_HOSPITALS
from schemas.patient import PatientContext
from schemas.health import HealthAssessment

app = FastAPI(
    title="MediNexus AI — Smart Healthcare API",
    description="Backend AI Triage Assessment, Pathway Resolver & Recommendation Engine",
    version="1.0.0"
)

# Enable CORS for local React UI & Admin Portal
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_DOCTORS: List[Dict[str, Any]] = [
    {
        "id": "cardiology-1",
        "name": "Dr. Shiv Gupta, MD, FACC",
        "specialty": "Cardiology & Electrophysiology",
        "dept": "Cardiology",
        "title": "Senior Cardiologist • 19 yrs exp.",
        "facility": "Apollo Hospitals, New Delhi",
        "wing": "Cardiology Wing",
        "room": "Ste 4B",
        "rating": "4.9",
        "reviews": "(180+ verified reviews)",
        "copay": "₹800 Fee",
        "copayAmount": "₹800.00",
        "fee": "₹800 Fee",
        "earliest": "Today, Oct 24",
        "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80",
        "is_video_available": True
    },
    {
        "id": "neurology-1",
        "name": "Dr. Ananya Roy, MD, DM",
        "specialty": "Neurology & Clinical Triage",
        "dept": "Neurology",
        "title": "Neurovascular Specialist • 16 yrs exp.",
        "facility": "Max Super Speciality Hospital, Gurgaon",
        "wing": "Neurology Tower",
        "room": "Room 402",
        "rating": "4.95",
        "reviews": "(142 verified reviews)",
        "copay": "₹1,000 Fee",
        "copayAmount": "₹1000.00",
        "fee": "₹1,000 Fee",
        "earliest": "Tomorrow, Oct 25",
        "photo": "https://images.unsplash.com/photo-1594824813511-1376d2994eb6?auto=format&fit=crop&w=400&q=80",
        "is_video_available": True
    },
    {
        "id": "dermatology-1",
        "name": "Dr. Sunita Deshmukh, MD",
        "specialty": "Dermatology & Tele-Health",
        "dept": "Dermatology",
        "title": "Lead Tele-Dermatologist • 12 yrs exp.",
        "facility": "Fortis Healthcare Tele-Clinic",
        "wing": "Ambulatory Care Wing",
        "room": "Room 210",
        "rating": "4.95",
        "reviews": "(215 verified reviews)",
        "copay": "₹500 Fee (Teleconsult Covered)",
        "copayAmount": "₹500.00",
        "fee": "₹500 Fee",
        "earliest": "Available Now",
        "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
        "is_video_available": True
    },
    {
        "id": "primary-care-1",
        "name": "Dr. Rajesh Iyer, MD",
        "specialty": "Primary Care & Internal Medicine",
        "dept": "Primary Care",
        "title": "Lead Internal Medicine • 14 yrs exp.",
        "facility": "Manipal Hospital, Bengaluru",
        "wing": "OPD Block",
        "room": "Suite 112",
        "rating": "4.8",
        "reviews": "(240+ verified reviews)",
        "copay": "₹600 Fee",
        "copayAmount": "₹600.00",
        "fee": "₹600 Fee",
        "earliest": "Today, Oct 24",
        "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
        "is_video_available": True
    },
    {
        "id": "orthopedics-1",
        "name": "Dr. Vikram Malhotra, MS",
        "specialty": "Orthopedics & Sports Medicine",
        "dept": "Orthopedics",
        "title": "Orthopedic & Joint Surgeon • 21 yrs exp.",
        "facility": "BLK-Max Super Speciality Hospital",
        "wing": "Orthopedics Wing",
        "room": "Room 108",
        "rating": "4.9",
        "reviews": "(195 verified reviews)",
        "copay": "₹1,200 Fee",
        "copayAmount": "₹1200.00",
        "fee": "₹1,200 Fee",
        "earliest": "Tomorrow, Oct 25",
        "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80",
        "is_video_available": False
    }
]

# Pre-indexed Doctor lookup cache by department
DOCTORS_BY_DEPT: Dict[str, List[dict]] = {}
for _doc in MOCK_DOCTORS:
    _doc_dept = (_doc.get("dept") or _doc.get("specialty") or "").lower()
    for _k in ["cardiology", "neurology", "dermatology", "primary care", "general medicine", "orthopedics", "emergency medicine", "pediatrics", "gynecology"]:
        if _k in _doc_dept:
            DOCTORS_BY_DEPT.setdefault(_k, []).append(_doc)

# Real-time Emergency Events Queue & SSE Subscribers
EMERGENCY_EVENTS: List[Dict[str, Any]] = [
    {
        "id": "evt-init-1",
        "event_type": "EMERGENCY_TRIAGE",
        "severity": "EMERGENCY",
        "emergency": True,
        "patient_id": "P-101",
        "patient_name": "Ananya Sharma",
        "ageGender": "29y • Female",
        "department": "Emergency Medicine",
        "symptoms": "Severe acute chest pressure with lightheadedness",
        "timestamp": "10 mins ago",
        "status": "NEW",
        "assessment": {
            "severity": "EMERGENCY",
            "emergency": True,
            "department": "Emergency Medicine",
            "next_step": "EMERGENCY",
            "consultation_mode": "NONE",
            "recommended_action": "Seek immediate emergency evaluation",
            "reason": "Exertional chest discomfort with diaphoresis",
            "immediate_guidance": [
                "Contact local emergency services immediately.",
                "Keep the patient resting and calm.",
                "Do not leave the person alone."
            ]
        },
        "immediate_guidance": [
            "Contact local emergency services immediately.",
            "Keep the patient resting and calm.",
            "Do not leave the person alone."
        ],
        "recommended_action": "Seek immediate emergency evaluation",
        "reason": "Exertional chest discomfort with diaphoresis",
        "recommended_hospital": "CityCare Hospital (HSP-001)",
        "distance": "1.8 km",
        "available_beds": 5,
        "doctors_on_duty": 4
    }
]

SSE_SUBSCRIBERS: List[asyncio.Queue] = []


class PatientAssessmentRequest(BaseModel):
    patient_input: Optional[str] = Field(default=None, description="Patient reported symptoms and complaint")
    symptomText: Optional[str] = Field(default=None, description="Alternative frontend symptom text parameter")
    text: Optional[str] = Field(default=None, description="Alternative text parameter")
    patient_context: Optional[PatientContext] = Field(default=None, description="Patient medical background")
    patient_latitude: float = Field(default=23.2599, description="Patient current latitude")
    patient_longitude: float = Field(default=77.4126, description="Patient current longitude")
    request_id: Optional[str] = Field(default=None, description="Client request tracing ID")
    patient_name: Optional[str] = Field(default="Ananya Sharma", description="Patient full name")
    patient_mrn: Optional[str] = Field(default="MN-PT-4091", description="Patient ABHA / Medical Record Number")
    past_records: Optional[List[str]] = Field(default=None, description="Patient documented medical history records")

    def get_input_text(self) -> str:
        val = self.patient_input or self.symptomText or self.text or ""
        return val.strip()


class PatientAssessmentResponse(BaseModel):
    assessment: HealthAssessment
    pathway: Dict[str, Any]
    hospitals: List[dict]
    doctors: List[dict] = Field(default_factory=list)
    total_eligible: int
    original_transcript: Optional[str] = None
    detected_language: Optional[str] = None
    request_id: Optional[str] = None
    ai_summary: Optional[Dict[str, Any]] = None


class EmergencyPrescreenRequest(BaseModel):
    symptomText: Optional[str] = None
    patient_input: Optional[str] = None
    text: Optional[str] = None


class DoctorSummaryRequest(BaseModel):
    name: Optional[str] = "Patient"
    mrn: Optional[str] = "MN-PT-1001"
    reason: Optional[str] = "Reported symptoms"
    history: Optional[str] = "None recorded"
    allergies: Optional[str] = "None"
    meds: Optional[str] = "None"
    priority: Optional[str] = "NORMAL"
    recommendation: Optional[str] = "Clinical follow-up"


class VoiceTranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    sample_text: Optional[str] = "I have severe chest discomfort and heavy breathing."


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "MediNexus AI Backend Engine",
        "version": "1.0.0"
    }


@app.get("/api/hospitals", tags=["Hospitals"])
def list_hospitals():
    formatted = []
    for h in DEFAULT_HOSPITALS:
        # Sum available_beds across ALL departments for accurate total vacant beds
        total_vacant = sum(d.available_beds for d in h.departments) if h.departments else 5
        formatted.append({
            "id": h.hospital_id,
            "hospital_id": h.hospital_id,
            "name": h.name,
            "address": h.address,
            "phone": h.phone,
            "totalBeds": h.total_beds,
            "vacantBeds": total_vacant,
            "erStatus": h.er_status,
            "dist": h.dist_str or "2.0 km",
            "time": h.time_str or "8 mins",
            "traffic": h.traffic or "Clear",
            "latitude": h.latitude,
            "longitude": h.longitude,
            "departments": [d.dict() for d in h.departments]
        })
    # Return plain array — frontend does Array.isArray() check
    return formatted


async def event_generator():
    queue = asyncio.Queue()
    SSE_SUBSCRIBERS.append(queue)
    try:
        init_msg = {"event_type": "CONNECTED", "events": EMERGENCY_EVENTS}
        yield f"data: {json.dumps(init_msg)}\n\n"
        while True:
            event = await queue.get()
            yield f"data: {json.dumps(event)}\n\n"
    except asyncio.CancelledError:
        if queue in SSE_SUBSCRIBERS:
            SSE_SUBSCRIBERS.remove(queue)


@app.get("/api/events/stream", tags=["Real-Time Doctor Alerts"])
async def stream_events():
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/events", tags=["Doctor & Hospital Portal"])
def get_emergency_events():
    return {
        "events": EMERGENCY_EVENTS,
        "count": len(EMERGENCY_EVENTS)
    }


@app.post("/api/events/{event_id}/status", tags=["Doctor & Hospital Portal"])
def update_event_status(event_id: str, payload: Dict[str, Any]):
    new_status = payload.get("status", "ACKNOWLEDGED")
    for ev in EMERGENCY_EVENTS:
        if ev.get("id") == event_id or ev.get("patient_id") == event_id:
            ev["status"] = new_status
            return {"status": "success", "event": ev}
    return {"status": "updated", "event_id": event_id, "new_status": new_status}


@app.post("/api/assess", response_model=PatientAssessmentResponse, tags=["Triage & Recommendation"])
def assess_patient(payload: PatientAssessmentRequest):
    t_start = time.perf_counter()
    input_text = payload.get_input_text()
    if not input_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient input description cannot be empty."
        )

    req_id = payload.request_id or f"TRIAGE-{int(time.time() * 1000) % 10000:04d}"
    print(f"\n[{req_id}] INPUT:\n{input_text}", flush=True)
    print(f"[{req_id}] FASTAPI_RECEIVED:\npatient_input={input_text}, latitude={payload.patient_latitude}, longitude={payload.patient_longitude}", flush=True)

    try:
        # Step 1: AI Health Assessment via Nemotron & Emergency Interceptor
        raw_assessment = analyze_patient(
            patient_input=input_text,
            patient_context=payload.patient_context,
            request_id=req_id
        )

        # Step 2: Emergency Safety Layer validation & normalization
        t_safety_start = time.perf_counter()
        validated_assessment = validate_emergency_assessment(raw_assessment, request_id=req_id)
        t_safety_end = time.perf_counter()
        safety_time = t_safety_end - t_safety_start

        # Step 3: Healthcare Pathway Resolver
        t_pathway_start = time.perf_counter()
        pathway_obj = resolve_pathway(validated_assessment)
        t_pathway_end = time.perf_counter()
        pathway_time = t_pathway_end - t_pathway_start

        # Step 4: Hospital Eligibility & Suitability Ranking Engine
        t_hosp_start = time.perf_counter()
        recommendations = find_suitable_hospital(
            assessment=validated_assessment,
            hospitals=DEFAULT_HOSPITALS,
            patient_latitude=payload.patient_latitude,
            patient_longitude=payload.patient_longitude
        )
        t_hosp_end = time.perf_counter()
        hosp_time = t_hosp_end - t_hosp_start

        # Step 5: Filter Doctors by AI-Selected Department via fast pre-indexed dictionary
        t_doc_start = time.perf_counter()
        dept_lower = (validated_assessment.department or "").lower()
        matching_doctors = []
        for k, doc_list in DOCTORS_BY_DEPT.items():
            if k in dept_lower or dept_lower in k:
                matching_doctors.extend(doc_list)
        if not matching_doctors or dept_lower in ["general medicine", "primary care", "undetermined"]:
            matching_doctors = MOCK_DOCTORS
        t_doc_end = time.perf_counter()
        doc_time = t_doc_end - t_doc_start

        # Step 6: Broadcast Emergency Event if Critical/Emergency
        ai_doctor_summary = None
        if validated_assessment.emergency or validated_assessment.severity == "EMERGENCY":
            top_hosp = recommendations[0] if recommendations else None
            evt_id = f"evt-{int(time.time() * 1000)}"

            patient_name = payload.patient_name or "Ananya Sharma"
            patient_id = payload.patient_mrn or "MN-PT-4091"
            age_gender = "29y • Female"
            if payload.patient_context and payload.patient_context.age and payload.patient_context.gender:
                age_gender = f"{payload.patient_context.age}y • {payload.patient_context.gender}"

            allergies_str = ", ".join(payload.patient_context.allergies) if (payload.patient_context and payload.patient_context.allergies) else "Penicillin, Sulfa Drugs"

            patient_past_records = payload.past_records or [
                "12-Lead ECG Baseline (Aug 2026): Normal sinus rhythm, borderline QTc.",
                "Comprehensive Lipid Profile & HbA1c (Sep 2026): Total Chol 198 mg/dL, HbA1c 5.6%.",
                "Neurology OPD (Sep 2026): Migraine with aura history.",
                "Allergies: Severe Penicillin & Sulfa drug hypersensitivity."
            ]

            # Generate AI Clinical Summary synthesizing current emergency complaint + past records
            t_sum_start = time.perf_counter()
            ai_doctor_summary = generate_emergency_doctor_summary(
                patient_name=patient_name,
                mrn=patient_id,
                reported_message=input_text,
                department=validated_assessment.department or "Emergency Medicine",
                severity=validated_assessment.severity,
                past_records=patient_past_records,
                allergies=allergies_str
            )
            t_sum_end = time.perf_counter()
            print(f"[PERF] Emergency Doctor Summary generated in: {(t_sum_end - t_sum_start):.2f} sec", flush=True)

            emergency_evt = {
                "id": evt_id,
                "event_type": "EMERGENCY_TRIAGE",
                "severity": "EMERGENCY",
                "emergency": True,
                "patient_id": patient_id,
                "patient_name": patient_name,
                "ageGender": age_gender,
                "department": validated_assessment.department or "Emergency Medicine",
                "symptoms": input_text,
                "reported_message": input_text,
                "timestamp": "Just now",
                "status": "NEW",
                "assessment": validated_assessment.dict(),
                "pathway": pathway_obj.to_dict(),
                "ai_summary": ai_doctor_summary,
                "past_records": patient_past_records,
                "allergies": allergies_str,
                "immediate_guidance": validated_assessment.immediate_guidance,
                "recommended_action": validated_assessment.recommended_action,
                "reason": validated_assessment.reason,
                "recommended_hospital": top_hosp.get("name") if top_hosp else "CityCare Hospital (HSP-001)",
                "distance": top_hosp.get("dist") if top_hosp else "1.8 km",
                "available_beds": top_hosp.get("vacantBeds") if top_hosp else 5,
                "doctors_on_duty": top_hosp.get("doctors_on_duty") if top_hosp else 4
            }
            EMERGENCY_EVENTS.insert(0, emergency_evt)

            # Notify active SSE subscribers
            for subscriber_queue in list(SSE_SUBSCRIBERS):
                try:
                    subscriber_queue.put_nowait(emergency_evt)
                except Exception:
                    pass

        from llm.analyzer import detect_language
        detected_lang = detect_language(input_text)
        t_total = time.perf_counter() - t_start

        print(f"[PERF] Safety: {safety_time:.4f} sec", flush=True)
        print(f"[PERF] Pathway: {pathway_time:.4f} sec", flush=True)
        print(f"[PERF] Hospital: {hosp_time:.4f} sec", flush=True)
        print(f"[PERF] Doctor: {doc_time:.4f} sec", flush=True)
        print(f"[PERF] Backend total: {t_total:.2f} sec", flush=True)
        print(f"[AI] Response generated for '{input_text}' (Language: {detected_lang})", flush=True)
        print(f"[AI] Severity: {validated_assessment.severity} | Emergency: {validated_assessment.emergency} | Pathway: {pathway_obj.next_step}", flush=True)
        print(f"[{req_id}] FINAL_API_RESPONSE:\nseverity={validated_assessment.severity}, emergency={validated_assessment.emergency}, department={validated_assessment.department}, next_step={pathway_obj.next_step}, total_hospitals={len(recommendations)}", flush=True)

        return PatientAssessmentResponse(
            assessment=validated_assessment,
            pathway=pathway_obj.to_dict(),
            hospitals=recommendations,
            doctors=matching_doctors,
            total_eligible=len(recommendations),
            original_transcript=input_text,
            detected_language=detected_lang,
            request_id=req_id,
            ai_summary=ai_doctor_summary
        )

    except Exception as exc:
        print(f"[ERROR] server.py assess_patient failure: {exc}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MediNexus AI processing failure: {str(exc)}"
        )


@app.post("/api/emergency/prescreen", tags=["Emergency Pipeline"])
def prescreen_emergency_endpoint(payload: EmergencyPrescreenRequest):
    text = (payload.patient_input or payload.symptomText or payload.text or "").strip()
    if not text:
        return {"is_emergency": False, "assessment": None}

    result = prescreen_emergency(text)
    if result:
        return {
            "is_emergency": True,
            "severity": "EMERGENCY",
            "assessment": result.dict()
        }
    return {
        "is_emergency": False,
        "severity": "ROUTINE",
        "assessment": None
    }


@app.post("/api/doctor/summary", tags=["Doctor Portal"])
def get_doctor_patient_summary(payload: DoctorSummaryRequest):
    summary = generate_doctor_patient_summary(payload.dict())
    return {
        "summary": summary,
        "status": "success"
    }


@app.post("/api/voice/transcribe", tags=["Voice Pipeline"])
def transcribe_voice(payload: VoiceTranscribeRequest):
    transcription = payload.sample_text or "Mujhe seene mein dard ho raha hai."
    return {
        "transcribed_text": transcription,
        "status": "transcribed"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:app", host="127.0.0.1", port=8080, reload=True)
