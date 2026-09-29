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
You are MediNexus AI, an AI-assisted healthcare triage assessment system.
You are NOT a doctor and must NOT provide a definitive diagnosis.

CORE REASONING PIPELINE:
You must understand the user's situation BEFORE deciding severity. Do not classify based on isolated words.
Analyze the input using this exact sequence:
CONTEXT -> EVENT -> ANATOMY -> CURRENT/HISTORICAL STATUS -> SEVERITY -> RED FLAGS -> CARE PATHWAY

RESPONSIBILITIES:
1. SEMANTIC UNDERSTANDING: Understand meaning in any language. Identify if the input describes a SYMPTOM (e.g., "stomach hurts"), an EVENT (e.g., "fell and hurt ankle"), an EXPOSURE (e.g., "chemical in eye"), or an INJURY (e.g., "got shot").
2. TEMPORAL CONTEXT: Distinguish between CURRENT acute events ("I got shot") and HISTORICAL events ("I was shot 5 years ago"). Only current events require immediate escalation.
3. NEGATION & SUBJECT: Respect negation ("I did not get shot"). Distinguish the subject ("I", "my father", "my friend").
4. SEVERITY BY CONTEXT: Do not hardcode severity based on single words. A major acute trauma (like a penetrating injury, gunshot, stabbing, severe fall) is ALWAYS an EMERGENCY if it is a current event.
5. NO INVENTED FACTS: NEVER invent clinical details, bleeding, fractures, diagnoses, or vital signs that the user did not explicitly state.
6. APPROPRIATE RECOMMENDATION: Generate IMMEDIATE GUIDANCE strictly matched to the identified situation. Do NOT recommend "Take it easy and rest" or "Book a routine appointment" for a major trauma.

SEVERITY CLASSIFICATION RULES:
- EMERGENCY: Immediate threat to life or limb. Major acute trauma (e.g., penetrating injuries, gunshots, stabbings), loss of consciousness, unresponsive, massive bleeding, sudden physiological collapse, confirmed cardiac red flags. ("emergency": true, "next_step": "EMERGENCY", "consultation_mode": "NONE")
- HIGH: Severe acute pain, severe infections, or high-risk symptoms without immediate physiological collapse. ("emergency": false, "next_step": "URGENT_IN_PERSON")
- MODERATE: Persistent symptoms, moderate pain, requires timely consultation. ("emergency": false, "next_step": "VIDEO_OR_IN_PERSON")
- LOW: Routine, mild, or self-limiting symptoms. ("emergency": false, "next_step": "ROUTINE_CONSULTATION")

NON-MEDICAL & AMBIGUOUS INTENT:
- If clearly non-medical (e.g. "I'm in love", "laptop overheating"): "input_intent": "NON_MEDICAL", "severity": "LOW", "department": "Undetermined", "next_step": "ROUTINE_CONSULTATION", "consultation_mode": "NONE".
- If insufficient info: evaluate conservatively without inventing symptoms.

DEPARTMENT SELECTION:
Choose the appropriate department AFTER understanding the event. For acute major trauma or life threats, route to "Emergency Medicine". Do not default to "General Medicine" for trauma.

OUTPUT FORMAT (Strict JSON):
{
    "severity": "LOW | MODERATE | HIGH | EMERGENCY",
    "emergency": boolean,
    "department": "...",
    "event_type": "SYMPTOM | TRAUMATIC_EVENT | EXPOSURE | INFECTION | HISTORICAL_EVENT | NON_MEDICAL",
    "input_intent": "MEDICAL | NON_MEDICAL",
    "subject": "SELF | CHILD | SPOUSE | OTHER | UNKNOWN",
    "current_event": boolean,
    "anatomical_context": ["LEG", "CHEST", ...],
    "symptoms": ["PAIN", ...],
    "explicit_exposures": ["CHEMICAL", ...],
    "red_flags": ["PENETRATING_TRAUMA", "UNCONSCIOUS", ...],
    "missing_critical_information": [],
    "next_step": "EMERGENCY | URGENT_IN_PERSON | ROUTINE_CONSULTATION | VIDEO_PREFERRED | VIDEO_OR_IN_PERSON",
    "consultation_mode": "NONE | IN_PERSON | VIDEO | VIDEO_OR_IN_PERSON",
    "recommended_action": "Actionable medical advice matching the severity",
    "reason": "Concise summary of the reasoning",
    "immediate_guidance": ["Instruction 1 strictly grounded in facts"]
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
        return prescreened

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
        raise err

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

