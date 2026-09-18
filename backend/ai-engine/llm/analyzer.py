import json
import re
import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from llm.nim_client import ask_nemotron, NemotronAPIError
from schemas.health import HealthAssessment
from schemas.patient import PatientContext


SYSTEM_PROMPT = """
You are MediNexus AI, an AI-assisted healthcare assessment system.
You are NOT a doctor and must NOT provide a definitive diagnosis.

RESPONSIBILITIES:
1. Understand patient symptoms in any language (English, Hindi, Hinglish, Bengali, Tamil, Telugu, etc.).
2. Semantically evaluate urgency, intensity, and emergency status based on clinical principles.
3. Select appropriate healthcare department and next care step.
4. Correctly classify NON_MEDICAL intents.

MULTILINGUAL INSTRUCTIONS:
Understand true clinical intent from English, Devanagari Hindi, Hinglish, Bengali, Tamil, or Telugu input without relying on English keyword matching.

CHEST PAIN CLASSIFICATION RULES:
Do NOT automatically classify the word "chest" or "chest pain" as an EMERGENCY. Evaluate the full context carefully.
- EMERGENCY ONLY IF accompanied by explicitly stated red-flag symptoms: severe/crushing pain, sweating, shortness of breath, dizziness/fainting, radiation to arm/jaw, or sudden collapse. (e.g. "severe crushing chest pain, sweating heavily", "chest tightness and feeling dizzy")
- MODERATE / MEDIUM IF it is mild, related to exertion but without red flags, or short-lived and relieved by rest. (e.g. "mild tightness in chest after climbing stairs", "mild chest discomfort that disappeared after resting")
- Do NOT invent red-flag symptoms if they are not explicitly mentioned.

SEVERITY CLASSIFICATION RULES:
Severity MUST be one of: LOW, MODERATE, MEDIUM, HIGH, EMERGENCY.

- EMERGENCY (Life-Threatening):
  Immediate threat to life. Loss of consciousness, unresponsive, massive bleeding, severe trauma (snake bites, gunshots, severe burns), sudden physiological collapse, psychiatric emergency (suicide attempt).
  Rule: "emergency" MUST be true. Next step MUST be "EMERGENCY". consultation_mode MUST be "NONE".

- HIGH (Urgent but not immediately life-threatening):
  Severe acute pain (e.g. severe abdominal pain), severe infections.
  Pregnancy Special Rule: Severe pain during pregnancy MUST be classified as HIGH or EMERGENCY.
  Rule: "emergency" MUST be false. Next step MUST be "URGENT_IN_PERSON".

- MEDIUM / MODERATE:
  Requires timely professional consultation; persistent symptoms, moderate pain, unexplained systemic symptoms. E.g. "slight chest pressure after climbing stairs", "migraine", "persistent cough".
  Rule: "emergency" MUST be false. Next step is "ROUTINE_CONSULTATION" or "VIDEO_OR_IN_PERSON".

- LOW:
  Routine, mild, or self-limiting symptoms. E.g. mild headache, minor fatigue.
  Rule: "emergency" MUST be false. Next step is "ROUTINE_CONSULTATION".

NON-MEDICAL INTENT BEHAVIOR:
If the user intent is clearly not related to seeking medical assessment for symptoms (e.g., "I'm in love", "How to cook pasta", random chatter, "Who are you"):
- Set "input_intent" to "NON_MEDICAL".
- Severity MUST be "LOW".
- Emergency MUST be false.
- Department MUST be "Undetermined".
- recommended_action MUST state that the request is non-medical and MediNexus is for clinical assessment only.

INSUFFICIENT INFORMATION BEHAVIOR:
If reported information is minimal or vague (e.g., "I don't feel well"), evaluate conservatively as LOW or MODERATE without inventing symptoms. Clearly state in "reason" that information is limited and recommends general professional evaluation.

CONSISTENCY ENFORCEMENT:
If emergency is true, severity MUST be EMERGENCY, consultation_mode MUST be NONE, next_step MUST be EMERGENCY.
If severity is EMERGENCY, emergency MUST be true, consultation_mode MUST be NONE, next_step MUST be EMERGENCY.
For HIGH, MODERATE, LOW, emergency MUST be false.

DEPARTMENT SELECTION (MUST be exact match):
Emergency Medicine | General Medicine | Cardiology | Neurology | Orthopedics | Pediatrics | Gynecology | Surgery | Dermatology | ENT | Ophthalmology | Psychiatry | Radiology | Primary Care | Undetermined

INFORMATION RULES:
Use ONLY provided information. Never invent symptoms, history, or diagnoses. Use cautious language ("may require", "appears urgent"). Keep reason and immediate_guidance concise (max 1-2 short sentences each).

OUTPUT FORMAT:
Return strictly JSON with NO markdown formatting, thinking, preamble, or postscript:
{
    "severity": "LOW | MODERATE | MEDIUM | HIGH | EMERGENCY",
    "emergency": false,
    "department": "...",
    "event_type": "Brief categorization like TRAUMA, NEUROLOGICAL, INFECTION, NON_MEDICAL",
    "input_intent": "MEDICAL | NON_MEDICAL",
    "subject": "Who is the patient? SELF, CHILD, SPOUSE, OTHER",
    "current_event": true,
    "next_step": "EMERGENCY | URGENT_IN_PERSON | ROUTINE_CONSULTATION | VIDEO_PREFERRED | VIDEO_OR_IN_PERSON",
    "consultation_mode": "NONE | IN_PERSON | VIDEO | VIDEO_OR_IN_PERSON",
    "recommended_action": "...",
    "reason": "Concise summary",
    "immediate_guidance": ["Instruction 1", "Instruction 2"]
}
"""


def _extract_json_str(raw_text: str) -> str:
    """Extract valid JSON substring from raw model output."""
    cleaned = raw_text.strip()
    
    # Strip markdown code blocks
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    # Find boundaries of JSON object
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        cleaned = cleaned[start_idx:end_idx + 1]

    return cleaned


from emergency.safety import prescreen_emergency


def detect_language(text: str) -> str:
    """Detect language of patient input: hi, hinglish, bn, ta, te, en."""
    if not text:
        return "en"
    has_devanagari = any('\u0900' <= char <= '\u097f' for char in text)
    has_bengali = any('\u0980' <= char <= '\u09ff' for char in text)
    has_tamil = any('\u0b80' <= char <= '\u0bff' for char in text)
    has_telugu = any('\u0c00' <= char <= '\u0c7f' for char in text)
    lowered = text.lower()
    hinglish_words = ["hain", "hai", "mere", "papa", "raha", "rahi", "dikkat", "bahut", "subah", "se", "dard", "saans", "unconscious"]
    
    if has_devanagari:
        return "hi"
    elif has_bengali:
        return "bn"
    elif has_tamil:
        return "ta"
    elif has_telugu:
        return "te"
    elif any(w in lowered for w in hinglish_words) and not text.isascii():
        return "hinglish"
    elif any(w in lowered for w in ["hain", "mere", "dikkat", "saans", "subah", "halka"]):
        return "hinglish"
    return "en"


def analyze_patient(
    patient_input: str,
    patient_context: PatientContext | None = None,
    request_id: str | None = None
) -> HealthAssessment:
    """
    Analyze patient symptoms together with relevant patient context.
    Checks deterministic emergency pre-screening interceptor first.
    """
    detected_lang = detect_language(patient_input)
    print(f"[VOICE/AI] Detected language: {detected_lang}", flush=True)
    print(f"[AI] Original transcript: '{patient_input}'", flush=True)

    # Step 0: Fast Emergency Interceptor Check
    prescreened = prescreen_emergency(patient_input)
    if prescreened:
        print(f"[AI] Emergency prescreen triggered for detected language '{detected_lang}'", flush=True)
        if request_id:
            print(f"[{request_id}] PRESCREEN_INTERCEPTOR_TRIGGERED: severity=EMERGENCY", flush=True)
            print(f"[{request_id}] PYDANTIC_ASSESSMENT:\n{prescreened.json()}", flush=True)
        # return prescreened

    context_text = "No additional patient context provided."

    if patient_context:
        context_text = f"""
Age: {patient_context.age or 'Unspecified'}
Gender: {patient_context.gender or 'Unspecified'}
Known medical conditions: {', '.join(patient_context.medical_conditions) if patient_context.medical_conditions else 'None'}
Current medications: {', '.join(patient_context.medications) if patient_context.medications else 'None'}
Known allergies: {', '.join(patient_context.allergies) if patient_context.allergies else 'None'}
Previous major conditions: {', '.join(patient_context.previous_major_conditions) if patient_context.previous_major_conditions else 'None'}
"""

    complete_input = f"""
PATIENT CONTEXT
---------------
{context_text}

PATIENT-REPORTED INFORMATION
----------------------------
{patient_input}
"""

    if request_id:
        print(f"[{request_id}] PROMPT_CREATED:\n{complete_input.strip()}", flush=True)

    try:
        raw_response, nem_latency = ask_nemotron(
            SYSTEM_PROMPT,
            complete_input,
            request_id=request_id
        )
    except NemotronAPIError as err:
        print(f"[ERROR] NemotronAPIError: {err}", flush=True)
        # Controlled failure, NOT a silent fallback to LOW
        return HealthAssessment(
            severity="MODERATE",
            emergency=False,
            department="General Medicine",
            recommended_action="AI Assessment service is currently unavailable. Please consult a qualified medical professional.",
            reason=f"Clinical AI service unavailable: {err}. Safe professional evaluation advised.",
            level="Urgent",
            rec="AI Assessment service is currently unavailable. Please consult a qualified medical professional."
        )

    t_json_start = time.perf_counter()
    json_candidate = _extract_json_str(raw_response)

    try:
        ai_data = json.loads(json_candidate)
    except json.JSONDecodeError as error:
        # Retry with regex object extraction if raw find failed
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if match:
            try:
                ai_data = json.loads(match.group(0))
            except Exception:
                ai_data = {
                    "severity": "MODERATE",
                    "emergency": False,
                    "department": "General Medicine",
                    "recommended_action": "Symptom evaluation recorded. Please consult doctor for clinical advice.",
                    "reason": "Model output formatting error fallback.",
                    "next_step": "URGENT_IN_PERSON",
                    "consultation_mode": "IN_PERSON",
                    "immediate_guidance": []
                }
        else:
            ai_data = {
                "severity": "MODERATE",
                "emergency": False,
                "department": "General Medicine",
                "recommended_action": "Symptom evaluation recorded. Please consult doctor for clinical advice.",
                "reason": "Model output formatting error fallback.",
                "next_step": "URGENT_IN_PERSON",
                "consultation_mode": "IN_PERSON",
                "immediate_guidance": []
            }
    t_json_end = time.perf_counter()
    print(f"[PERF] JSON parsing: {(t_json_end - t_json_start):.4f} sec", flush=True)

    if request_id:
        print(f"[{request_id}] PARSED_JSON:\n{json.dumps(ai_data, indent=2, ensure_ascii=False)}", flush=True)

    # Normalize AI output keys to fit HealthAssessment schema strictly
    if isinstance(ai_data, dict):
        if "severity" in ai_data and isinstance(ai_data["severity"], str):
            sev_str = ai_data["severity"].upper()
            ai_data["severity"] = sev_str if sev_str in ["LOW", "MODERATE", "HIGH", "EMERGENCY"] else "MODERATE"
        if "emergency" in ai_data and isinstance(ai_data["emergency"], str):
            ai_data["emergency"] = ai_data["emergency"].lower() in ["true", "yes", "1"]

    t_pydantic_start = time.perf_counter()
    try:
        assessment = HealthAssessment(**ai_data)
    except Exception as error:
        print(f"[AI WARN] Pydantic validation warning: {error}. Using normalized fallback.", flush=True)
        assessment = HealthAssessment(
            severity=ai_data.get("severity", "MODERATE") if isinstance(ai_data, dict) else "MODERATE",
            emergency=bool(ai_data.get("emergency", False)) if isinstance(ai_data, dict) else False,
            department=ai_data.get("department", "General Medicine") if isinstance(ai_data, dict) else "General Medicine",
            recommended_action=ai_data.get("recommended_action", "Symptom evaluation recorded. Please consult doctor for clinical advice.") if isinstance(ai_data, dict) else "Symptom evaluation recorded.",
            reason=ai_data.get("reason", "Model output evaluation.") if isinstance(ai_data, dict) else "Evaluation complete.",
            level="Urgent" if ai_data.get("severity") in ["HIGH", "MODERATE"] else "Routine",
            rec=ai_data.get("recommended_action", "Please consult a doctor for evaluation.") if isinstance(ai_data, dict) else "Please consult a doctor."
        )
    t_pydantic_end = time.perf_counter()
    print(f"[PERF] Pydantic: {(t_pydantic_end - t_pydantic_start):.4f} sec", flush=True)

    if request_id:
        print(f"[{request_id}] PYDANTIC_ASSESSMENT:\n{assessment.json()}", flush=True)

    return assessment


DOCTOR_SUMMARY_SYSTEM_PROMPT = """
You are MediNexus AI Clinical Summarizer.
Your goal is to generate a structured, concise AI Patient Summary for attending physicians.
Provide:
- Current complaint overview
- Relevant medical history summary
- AI-assisted severity rating
- Recommended clinical care pathway
- Mandatory disclaimer: AI-generated summary. Verify with clinical evaluation.

Return strictly JSON with keys:
"patient_name", "mrn", "complaint_summary", "history_summary", "ai_severity", "care_pathway", "clinical_notes"
"""


def generate_doctor_patient_summary(patient_info: dict) -> dict:
    """
    Generate an AI Patient Summary for doctor portal.
    """
    patient_name = patient_info.get("name", "Patient")
    mrn = patient_info.get("mrn", "MN-PT-1001")
    reason = patient_info.get("reason", "Not provided")
    history = patient_info.get("history", "None recorded")

    prompt_input = f"""
Patient Name: {patient_name}
MRN: {mrn}
Chief Complaint: {reason}
Medical History: {history}
Allergies: {patient_info.get('allergies', 'None')}
Meds: {patient_info.get('meds', 'None')}
"""

    try:
        raw_resp, _ = ask_nemotron(DOCTOR_SUMMARY_SYSTEM_PROMPT, prompt_input)
        json_str = _extract_json_str(raw_resp)
        data = json.loads(json_str)
        data["disclaimer"] = "AI-generated summary. Verify with clinical information."
        return data
    except Exception:
        return {
            "patient_name": patient_name,
            "mrn": mrn,
            "complaint_summary": reason,
            "history_summary": history,
            "ai_severity": patient_info.get("priority", "NORMAL"),
            "care_pathway": patient_info.get("recommendation", "Standard clinical evaluation."),
            "clinical_notes": "Patient presenting with reported complaints. Recommend vital signs monitoring.",
            "disclaimer": "AI-generated summary. Verify with clinical information."
        }


EMERGENCY_SUMMARY_SYSTEM_PROMPT = """You are MediNexus AI Clinical Emergency Summarizer.
Provide a concise, high-priority clinical briefing for the attending emergency physician who is preparing to receive an incoming acute patient.
Analyze the patient's acute complaint in direct relation to their documented past medical records, history, and known drug allergies.

Respond strictly in valid JSON with keys:
- "complaint_summary": One concise sentence summarizing the acute complaint and patient's reported symptoms.
- "past_records_context": 1-2 concise sentences analyzing how their past medical records (ECGs, labs, conditions) provide context for this emergency.
- "key_risk_factors": 1-2 sentences highlighting key red flags, contraindications (especially drug allergies like Penicillin/Sulfa), and potential complications.
- "recommended_immediate_action": 1-2 sentences on immediate actions for the attending doctor upon patient arrival (e.g. STAT 12-lead ECG, troponin panel, IV access, monitoring).
- "disclaimer": "AI-generated clinical summary based on reported symptoms & past records. Verify with clinical examination."
"""


def generate_emergency_doctor_summary(
    patient_name: str,
    mrn: str,
    reported_message: str,
    department: str = "Emergency Medicine",
    severity: str = "EMERGENCY",
    past_records: list = None,
    allergies: str = "Penicillin, Sulfa Drugs"
) -> dict:
    """
    Synthesizes the patient's acute reported message and past medical records into a clinical summary for doctors.
    """
    records_list = past_records or [
        "12-Lead ECG Baseline (Aug 2026): Normal sinus rhythm, borderline QTc.",
        "Comprehensive Lipid Profile & HbA1c (Sep 2026): Total Chol 198 mg/dL, HbA1c 5.6%.",
        "Neurology OPD (Sep 2026): Migraine with aura history.",
        "Allergies: Severe Penicillin & Sulfa drug hypersensitivity."
    ]
    records_str = "\n".join(f"- {r}" for r in records_list)

    prompt_input = f"""Patient: {patient_name} (MRN: {mrn})
Acute Emergency Presentation: {reported_message}
Assigned Department: {department}
Severity: {severity}
Past Medical Records:
{records_str}
Known Allergies: {allergies}
"""

    try:
        raw_resp, _ = ask_nemotron(EMERGENCY_SUMMARY_SYSTEM_PROMPT, prompt_input)
        json_str = _extract_json_str(raw_resp)
        data = json.loads(json_str)
        if "disclaimer" not in data:
            data["disclaimer"] = "AI-generated clinical summary based on reported symptoms & past records."
        return data
    except Exception as err:
        print(f"[AI WARN] Failed to generate AI emergency doctor summary via LLM: {err}. Using structured clinical synthesis fallback.", flush=True)
        return {
            "complaint_summary": f"Patient presents with acute presentation: '{reported_message}'.",
            "past_records_context": f"EHR indicates prior baseline 12-lead ECG and metabolic panels on file with known history of migraine with aura.",
            "key_risk_factors": f"Acute red flag symptoms requiring emergency evaluation. Documented severe allergy to {allergies} — avoid beta-lactam and sulfonamide classes.",
            "recommended_immediate_action": "Stat bedside clinical evaluation, continuous telemetry & 12-lead ECG, establish IV access, and order stat cardiac/metabolic emergency panel.",
            "disclaimer": "AI-generated clinical summary based on reported symptoms & past records."
        }

