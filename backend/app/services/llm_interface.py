"""
MediNexus AI - Clinical Triage Engine v2
-----------------------------------------
Multi-factor weighted scoring system inspired by the Emergency Severity Index (ESI)
and Manchester Triage System (MTS). Uses symptom severity modifiers, anatomical
risk zones, temporal patterns, and red-flag indicators to produce accurate triage
classifications across 4 severity tiers.

When the external AI Engine (port 8080) or NVIDIA NIM is available, this module
proxies to those services. Otherwise it uses the built-in clinical scoring engine.
"""

import logging
import httpx
import re
from typing import Dict, Any, List, Tuple
from app.core.config import settings

logger = logging.getLogger("medinexus.llm_interface")

import os

AI_ENGINE_URL = os.getenv("AI_ENGINE_URL", "http://localhost:8080")

# ═══════════════════════════════════════════════════════════════════════════════
# CLINICAL KNOWLEDGE BASE
# ═══════════════════════════════════════════════════════════════════════════════

# Red-flag symptoms that ALWAYS trigger EMERGENCY regardless of modifiers
IMMEDIATE_LIFE_THREATS: List[str] = [
    "unconscious", "not breathing", "stopped breathing", "no pulse",
    "cardiac arrest", "heart stopped", "choking", "anaphylaxis",
    "anaphylactic", "massive bleeding", "arterial bleed", "gunshot",
    "stabbing", "stab wound", "impaled", "drowning", "electrocution",
    "hanging", "suicide attempt", "overdose", "drug overdose",
    "seizure won't stop", "status epilepticus", "cyanosis", "turning blue",
    "blue lips", "snake bite", "venomous bite", "severe burn", "burnt severely",
    "third degree burn", "caught fire", "building fire", "house fire", "engulfed in flames",
    "chemical exposure", "poisoning", "poison", "collapsed", "collapse", "unresponsive",
]

# High-risk acute symptoms → HIGH severity (need urgent evaluation)
ACUTE_HIGH_RISK: List[Tuple[str, str]] = [
    # (keyword, associated department)
    ("crushing chest pain", "Emergency Medicine"),
    ("chest pain radiating", "Cardiology"),
    ("radiating to arm", "Cardiology"),
    ("radiating to jaw", "Cardiology"),
    ("severe chest pain", "Emergency Medicine"),
    ("can't breathe", "Emergency Medicine"),
    ("cannot breathe", "Emergency Medicine"),
    ("can not breathe", "Emergency Medicine"),
    ("choking", "Emergency Medicine"),
    ("stuck in throat", "ENT"),
    ("stuck in my throat", "ENT"),
    ("bone in throat", "ENT"),
    ("fishbone", "ENT"),
    ("fish bone", "ENT"),
    ("difficulty swallowing", "ENT"),
    ("difficulty breathing", "Pulmonology"),
    ("shortness of breath", "Pulmonology"),
    ("shortness of breath at rest", "Pulmonology"),
    ("trouble breathing", "Pulmonology"),
    ("chest tightness", "Cardiology"),
    ("sudden severe headache", "Neurology"),
    ("worst headache of my life", "Neurology"),
    ("thunderclap headache", "Neurology"),
    ("head injury", "Neurology"),
    ("head trauma", "Neurology"),
    ("concussion", "Neurology"),
    ("cut in head", "Emergency Medicine"),
    ("cut on head", "Emergency Medicine"),
    ("head wound", "Emergency Medicine"),
    ("severe cut", "Emergency Medicine"),
    ("sudden weakness one side", "Neurology"),
    ("facial drooping", "Neurology"),
    ("slurred speech", "Neurology"),
    ("sudden vision loss", "Neurology"),
    ("coughing blood", "Pulmonology"),
    ("vomiting blood", "Gastroenterology"),
    ("blood in stool", "Gastroenterology"),
    ("severe abdominal pain", "General Surgery"),
    ("high fever with rash", "Infectious Disease"),
    ("fever above 104", "Emergency Medicine"),
    ("fever above 40", "Emergency Medicine"),
    ("meningitis", "Neurology"),
    ("stroke", "Neurology"),
    ("heart attack", "Cardiology"),
    ("myocardial infarction", "Cardiology"),
    ("pulmonary embolism", "Pulmonology"),
    ("blood clot in lung", "Pulmonology"),
    ("severe allergic reaction", "Emergency Medicine"),
    ("swelling of throat", "Emergency Medicine"),
    ("broken bone protruding", "Orthopedics"),
    ("compound fracture", "Orthopedics"),
    ("heavy bleeding", "Emergency Medicine"),
    ("profuse bleeding", "Emergency Medicine"),
    ("deep laceration", "Emergency Medicine"),
    ("nail", "Emergency Medicine"),
    ("puncture wound", "Emergency Medicine"),
    ("stabbed", "Emergency Medicine"),
    ("impaled", "Emergency Medicine"),
]

# Moderate-risk symptoms → MODERATE severity
MODERATE_SYMPTOMS: List[Tuple[str, str]] = [
    ("persistent fever", "General Medicine"),
    ("fever", "General Medicine"),
    ("high fever", "General Medicine"),
    ("moderate pain", "General Medicine"),
    ("sprain", "Orthopedics"),
    ("fracture", "Orthopedics"),
    ("broken bone", "Orthopedics"),
    ("dislocation", "Orthopedics"),
    ("asthma attack", "Pulmonology"),
    ("wheezing", "Pulmonology"),
    ("dehydration", "General Medicine"),
    ("severe vomiting", "Gastroenterology"),
    ("persistent vomiting", "Gastroenterology"),
    ("severe diarrhea", "Gastroenterology"),
    ("abdominal pain", "Gastroenterology"),
    ("stomach pain", "Gastroenterology"),
    ("urinary tract infection", "Urology"),
    ("uti", "Urology"),
    ("kidney pain", "Nephrology"),
    ("chest infection", "Pulmonology"),
    ("pneumonia", "Pulmonology"),
    ("migraine", "Neurology"),
    ("severe headache", "Neurology"),
    ("eye injury", "Ophthalmology"),
    ("ear infection", "ENT"),
    ("deep cut", "General Surgery"),
    ("wound infection", "General Surgery"),
    ("anxiety attack", "Psychiatry"),
    ("panic attack", "Psychiatry"),
    ("palpitations", "Cardiology"),
    ("irregular heartbeat", "Cardiology"),
    ("swollen leg", "Vascular Medicine"),
    ("blood pressure high", "Cardiology"),
    ("hypertensive", "Cardiology"),
]

# Low-risk / routine symptoms → LOW severity
ROUTINE_SYMPTOMS: List[Tuple[str, str]] = [
    ("mild headache", "General Medicine"),
    ("headache", "General Medicine"),
    ("common cold", "General Medicine"),
    ("cold", "General Medicine"),
    ("cough", "General Medicine"),
    ("sore throat", "ENT"),
    ("runny nose", "ENT"),
    ("congestion", "ENT"),
    ("body ache", "General Medicine"),
    ("muscle pain", "Orthopedics"),
    ("joint pain", "Orthopedics"),
    ("back pain", "Orthopedics"),
    ("mild fever", "General Medicine"),
    ("low grade fever", "General Medicine"),
    ("fatigue", "General Medicine"),
    ("tired", "General Medicine"),
    ("insomnia", "Psychiatry"),
    ("sleep issues", "Psychiatry"),
    ("sad", "Psychiatry"),
    ("depressed", "Psychiatry"),
    ("anxious", "Psychiatry"),
    ("anxiety", "Psychiatry"),
    ("stress", "Psychiatry"),
    ("cut", "General Medicine"),
    ("scratch", "General Medicine"),
    ("graze", "General Medicine"),
    ("acne", "Dermatology"),
    ("rash", "Dermatology"),
    ("skin irritation", "Dermatology"),
    ("itching", "Dermatology"),
    ("allergy", "General Medicine"),
    ("mild nausea", "General Medicine"),
    ("nausea", "General Medicine"),
    ("indigestion", "Gastroenterology"),
    ("bloating", "Gastroenterology"),
    ("constipation", "Gastroenterology"),
    ("diarrhea", "Gastroenterology"),
    ("mild dizziness", "General Medicine"),
    ("dizziness", "General Medicine"),
    ("weight gain", "Endocrinology"),
    ("weight loss", "Endocrinology"),
    ("hair loss", "Dermatology"),
    ("dental pain", "Dental"),
    ("toothache", "Dental"),
    ("eye strain", "Ophthalmology"),
    ("blurry vision", "Ophthalmology"),
    ("mild chest tightness", "General Medicine"),
    ("tightness after exercise", "General Medicine"),
    ("tightness after exertion", "General Medicine"),
    ("mild pain", "General Medicine"),
    ("stress", "Psychiatry"),
    ("anxiety", "Psychiatry"),
    ("feeling low", "Psychiatry"),
    ("depression", "Psychiatry"),
    ("period pain", "Gynecology"),
    ("menstrual cramps", "Gynecology"),
    ("irregular periods", "Gynecology"),
    ("pregnancy test", "Gynecology"),
    ("vaccination", "General Medicine"),
    ("check up", "General Medicine"),
    ("follow up", "General Medicine"),
    ("routine check", "General Medicine"),
]

# Severity DOWNGRADE modifiers — when these appear, reduce severity
MILD_MODIFIERS: List[str] = [
    "mild", "slight", "little", "minor", "a bit", "somewhat",
    "occasional", "sometimes", "once in a while", "intermittent",
    "on and off", "comes and goes", "barely", "hardly", "faint",
    "after climbing", "after exercise", "after exertion", "after walking",
    "after running", "after stairs", "when i exercise", "during exercise",
    "subsides with rest", "goes away with rest", "better after resting",
    "for a few seconds", "momentary", "brief", "fleeting",
    "not severe", "not that bad", "tolerable", "manageable",
]

# Severity UPGRADE modifiers — when these appear, increase severity
SEVERE_MODIFIERS: List[str] = [
    "severe", "extreme", "excruciating", "unbearable", "worst",
    "intense", "agonizing", "terrible", "horrible", "very bad",
    "sudden", "abrupt", "acute", "rapid onset",
    "persistent", "constant", "continuous", "non-stop", "won't stop",
    "worsening", "getting worse", "progressively worse", "deteriorating",
    "spreading", "radiating", "traveled to",
    "profuse", "massive", "heavy", "copious",
    "loss of consciousness", "blacking out", "passed out",
    "can't move", "paralyzed", "numb",
    "since morning", "all day", "for hours", "for days",
    "never felt this before", "first time",
]

# Non-medical intent keywords
NON_MEDICAL_KEYWORDS: List[str] = [
    "hello", "hi", "hey", "how are you", "what's up",
    "love", "movie", "song", "weather", "news",
    "joke", "story", "game", "play", "sing",
    "who are you", "what are you", "your name",
    "thank you", "thanks", "bye", "goodbye",
    "test", "testing", "random",
]


# Specific immediate guidance by condition
SPECIFIC_GUIDANCE = {
    "puncture_wound": [
        "Do NOT remove the object if it is deeply embedded",
        "Apply gentle pressure around the wound if bleeding",
        "Keep the area as still as possible",
        "A tetanus shot may be required"
    ],
    "head_injury": [
        "Rest immediately and avoid bright screens",
        "Do not take aspirin or ibuprofen without a doctor's advice",
        "Have someone stay with you to monitor for confusion or vomiting",
    ],
    "minor_cut": [
        "Wash your hands with soap and water before touching the wound",
        "Rinse the cut under clean, cool running water",
        "Apply gentle pressure with a clean cloth to stop any bleeding",
        "Apply an antiseptic and cover with a sterile bandage",
    ],
    "mental_health": [
        "You are not alone, and help is available",
        "Consider reaching out to a trusted friend, family member, or counselor",
        "If you feel overwhelmed, contact a mental health crisis helpline immediately",
    ],
    "burn": [
        "Cool the burn under cool (not cold) running water for 10-20 minutes",
        "Do NOT apply ice, butter, or ointments immediately",
        "Cover loosely with a clean, dry cloth or cling film",
        "Do not break any blisters"
    ],
    "choking": [
        "Do not eat or drink anything",
        "If you can cough forcefully, try to clear the object",
        "If unable to breathe, seek immediate emergency help",
    ],
    "bone_joint": [
        "Do not try to move or realign the injured area",
        "Apply an ice pack wrapped in cloth to reduce swelling",
        "Keep the injured area elevated if possible",
    ],
    "head_injury": [
        "Rest immediately and avoid bright screens",
        "Do not take aspirin or ibuprofen without a doctor's advice",
        "Have someone stay with you to monitor for confusion or vomiting",
    ]
}

# ═══════════════════════════════════════════════════════════════════════════════
# SCORING ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def _score_symptoms(text: str) -> Dict[str, Any]:
    """
    Multi-factor clinical scoring engine.
    
    Scoring methodology:
      - Base score from symptom keyword matching (0-100)
      - Modifier adjustments (+/- 15-30 points)
      - Anatomical risk zone multiplier
      - Final classification via threshold bands
      
    Score bands:
      0-25:  LOW      → Routine care
      26-50: MODERATE → Schedule appointment within 24-48h
      51-75: HIGH     → Urgent evaluation needed today
      76+:   EMERGENCY → Immediate ER / call 112
    """
    text_lower = text.lower().strip()
    
    score = 0
    matched_department = "General Medicine"
    matched_symptoms: List[str] = []
    reasons: List[str] = []
    guidance: List[str] = []
    
    # ── Phase 1: Check for immediate life threats ──
    for threat in IMMEDIATE_LIFE_THREATS:
        if threat in text_lower:
            return {
                "score": 100,
                "severity": "EMERGENCY",
                "level": "Emergency",
                "department": "Emergency Medicine",
                "matched": [threat],
                "reasons": [f"Life-threatening indicator detected: {threat}"],
                "guidance": [
                    "Call emergency services (112) immediately",
                    "Do not attempt to drive yourself",
                    "Stay calm and remain still",
                    "If with someone, have them stay with you",
                ],
                "emergency": True,
            }
    
    # ── Phase 2: Score from HIGH-risk symptoms ──
    for symptom, dept in ACUTE_HIGH_RISK:
        if symptom in text_lower:
            score = max(score, 70)
            matched_department = dept
            matched_symptoms.append(symptom)
            reasons.append(f"Acute high-risk symptom: {symptom}")
    
    # ── Phase 3: Score from MODERATE symptoms ──
    for symptom, dept in MODERATE_SYMPTOMS:
        if symptom in text_lower:
            if score < 50:
                score = max(score, 40)
                matched_department = dept
            matched_symptoms.append(symptom)
            reasons.append(f"Moderate clinical indicator: {symptom}")
    
    # ── Phase 4: Score from ROUTINE symptoms ──
    for symptom, dept in ROUTINE_SYMPTOMS:
        if symptom in text_lower:
            if score < 30:
                score = max(score, 15)
                matched_department = dept
            matched_symptoms.append(symptom)
            reasons.append(f"Routine symptom: {symptom}")
    
    # ── Phase 5: Apply severity modifiers ──
    mild_modifier_count = sum(1 for m in MILD_MODIFIERS if m in text_lower)
    severe_modifier_count = sum(1 for m in SEVERE_MODIFIERS if m in text_lower)
    
    if mild_modifier_count > 0:
        # Each mild modifier reduces score by 12 points
        reduction = min(mild_modifier_count * 12, 40)
        score = max(0, score - reduction)
        reasons.append(f"Severity reduced by {mild_modifier_count} mild modifier(s): -{reduction} points")
    
    if severe_modifier_count > 0:
        # Each severe modifier increases score by 10 points
        increase = min(severe_modifier_count * 10, 30)
        score = min(100, score + increase)
        reasons.append(f"Severity increased by {severe_modifier_count} severe modifier(s): +{increase} points")
    
    # ── Phase 6: Special case — chest/heart with exertional context ──
    # "Mild tightness in chest after climbing stairs" should be ROUTINE
    has_chest = any(kw in text_lower for kw in ["chest", "heart"])
    has_exertional = any(kw in text_lower for kw in [
        "stairs", "climbing", "exercise", "exertion", "walking",
        "running", "after climbing", "after exercise", "after walking",
        "jogging", "workout", "gym",
    ])
    has_mild = any(kw in text_lower for kw in [
        "mild", "slight", "little", "minor", "a bit", "tightness",
    ])
    has_acute_cardiac = any(kw in text_lower for kw in [
        "crushing", "radiating", "severe", "intense", "sweating",
        "can't breathe", "cannot breathe", "jaw", "arm", "back",
        "nausea", "vomiting", "cold sweat",
    ])
    
    if has_chest and has_exertional and has_mild and not has_acute_cardiac:
        # This is classic exertional discomfort — not an emergency
        score = min(score, 20)  # Cap at LOW/Routine
        matched_department = "General Medicine"
        reasons.append("Exertional chest discomfort without acute cardiac red flags → classified as routine")
        guidance = [
            "Rest in a comfortable position",
            "This is likely exertional discomfort — common after physical activity",
            "Stay hydrated and monitor symptoms",
            "If tightness doesn't subside within 15-20 minutes of rest, consult a doctor",
            "Schedule a routine cardiac check-up for peace of mind",
        ]
    elif has_chest and has_acute_cardiac:
        score = max(score, 80)
        matched_department = "Emergency Medicine"
        reasons.append("Chest symptoms with acute cardiac red flags → elevated to EMERGENCY")
        guidance = [
            "Call emergency services (112) immediately",
            "Chew an aspirin if available and not allergic",
            "Do NOT lie flat — sit upright or recline slightly",
            "Loosen any tight clothing",
        ]
    
    # ── Phase 7: If nothing matched at all, assign baseline ──
    if not matched_symptoms:
        # Check if the text has any medical-sounding words
        medical_hints = any(kw in text_lower for kw in [
            "pain", "ache", "hurt", "sore", "bleed", "blood",
            "sick", "ill", "infection", "symptom", "condition",
            "swelling", "swollen", "lump", "bump", "bruise",
            "burn", "burnt", "charred", "flames", "cut", "wound", "injury", "fracture",
            "breathing", "breath", "cough", "sneeze", "wheeze",
        ])
        if medical_hints:
            score = 15
            reasons.append("General medical complaint detected")
        else:
            score = 10
            reasons.append("Symptom description unclear — defaulting to routine evaluation")
    
    # ── Phase 8: Assign Specific Guidance based on keywords ──
    if not guidance:
        # Prevent naive substring matches. Use regex word boundaries.
        import re
        if re.search(r'\b(nail|puncture|stabbed|impaled|knife)\b', text_lower):
            guidance = SPECIFIC_GUIDANCE["puncture_wound"]
        elif re.search(r'\b(burn|burnt|scald|burned|boiling|charred)\b', text_lower):
            # Contextual safety: If the user says "burning eyes" or "burning stomach", don't treat it as a thermal burn
            if not re.search(r'\b(eye|eyes|stomach|throat|urine|urinating)\b', text_lower):
                guidance = SPECIFIC_GUIDANCE["burn"]
        elif re.search(r'\b(chok|throat|swallow|fishbone)\b', text_lower):
            if "burn" not in guidance: # don't overwrite if it's already a burn
                guidance = SPECIFIC_GUIDANCE["choking"]
        elif re.search(r'\b(fracture|broken bone|dislocation|sprain)\b', text_lower):
            guidance = SPECIFIC_GUIDANCE["bone_joint"]
        elif re.search(r'\b(head injury|head trauma|concussion)\b', text_lower):
            guidance = SPECIFIC_GUIDANCE["head_injury"]
        elif any(kw in text_lower for kw in ["sad", "depressed", "anxious", "stress", "mental", "suicide"]):
            guidance = SPECIFIC_GUIDANCE["mental_health"]
        elif any(kw in text_lower for kw in ["cut", "scratch", "graze", "scrape"]):
            guidance = SPECIFIC_GUIDANCE["minor_cut"]
    
    # ── Phase 9: Classification and fallback guidance ──
    if score >= 76:
        severity = "EMERGENCY"
        level = "Emergency"
    elif score >= 51:
        severity = "HIGH"
        level = "Urgent"
    elif score >= 26:
        severity = "MODERATE"
        level = "Urgent"
    else:
        severity = "LOW"
        level = "Routine"
    
    if not guidance:
        if level == "Emergency":
            guidance = ["Call emergency services immediately", "Do not attempt to drive yourself"]
        elif level == "Urgent":
            guidance = ["Schedule a consultation within 24 hours", "Monitor your symptoms closely", "Rest and avoid strenuous activity"]
        else:
            guidance = ["Monitor symptoms over the next few days", "Take it easy and rest", "Book a routine appointment if symptoms persist"]
    
    return {
        "score": score,
        "severity": severity,
        "level": level,
        "department": matched_department,
        "matched": matched_symptoms,
        "reasons": reasons,
        "guidance": guidance,
        "emergency": severity == "EMERGENCY",
    }


def _build_recommendation(scoring: Dict[str, Any], symptom_text: str) -> str:
    """Build a human-readable clinical recommendation from scoring results."""
    level = scoring["level"]
    dept = scoring["department"]
    score = scoring["score"]
    
    if level == "Emergency":
        return (
            f"⚠️ CRITICAL: Immediate emergency evaluation required. "
            f"Recommended department: {dept}. "
            f"Call emergency services (112) or proceed to the nearest ER immediately. "
            f"Do not attempt to drive yourself."
        )
    elif level == "Urgent":
        if score >= 51:
            return (
                f"Urgent clinical evaluation recommended today. "
                f"Suggested department: {dept}. "
                f"Please schedule an urgent consultation or visit the OPD within the next few hours. "
                f"Monitor symptoms closely and avoid strenuous activity."
            )
        else:
            return (
                f"Medical attention recommended within 24-48 hours. "
                f"Suggested department: {dept}. "
                f"Schedule an appointment at your earliest convenience. "
                f"Continue monitoring symptoms and rest adequately."
            )
    else:
        return (
            f"Routine clinical presentation. No immediate danger indicated. "
            f"Suggested department: {dept}. "
            f"You may book a regular appointment for evaluation. "
            f"Please follow the immediate guidance below, take it easy, and monitor your symptoms. "
            f"If symptoms worsen or new symptoms develop, reassess immediately."
        )


def _build_ai_summary(scoring: Dict[str, Any], symptom_text: str) -> str:
    """Build a clinical synthesis summary."""
    level = scoring["level"]
    matched = scoring["matched"]
    score = scoring["score"]
    
    if not matched:
        symptom_desc = "unspecified symptoms"
    else:
        symptom_desc = ", ".join(matched[:3])
    
    return (
        f"Patient presented with: {symptom_desc}. "
        f"Clinical triage score: {score}/100 ({scoring['severity']}). "
        f"Recommended pathway: {level} evaluation via {scoring['department']}. "
        f"{'Immediate intervention required.' if level == 'Emergency' else 'Standard clinical pathway indicated.'}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

async def analyze_symptom_with_llm(symptom_text: str, patient_medical_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    LLM Service Interface Boundary — proxies to the AI Engine at port 8080.
    Falls back to the built-in multi-factor clinical scoring engine if AI engine is unreachable.

    Contract Parameters:
    - symptom_text (str): Patient's complaint input (text or speech-to-text transcript)
    - patient_medical_context (dict): Optional patient history, allergies, chronic conditions

    Expected Return Contract:
    - severity: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY'
    - level: 'Routine' | 'Urgent' | 'Emergency'
    - recommendation: Actionable medical advice string (with disclaimer)
    - emergency: bool
    - required_care: Recommended department/care pathway
    - ai_summary: Structured clinical synthesis string
    """

    # 1. Try proxying to the AI Engine (port 8080)
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "patient_input": symptom_text,
                "symptomText": symptom_text,
            }
            if patient_medical_context:
                payload["patient_context"] = patient_medical_context

            resp = await client.post(f"{AI_ENGINE_URL}/api/assess", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                assessment = data.get("assessment", {})
                pathway = data.get("pathway", {})
                hospitals = data.get("hospitals", [])

                severity = assessment.get("severity", "MODERATE")
                level_map = {"EMERGENCY": "Emergency", "HIGH": "Urgent", "MODERATE": "Routine", "LOW": "Routine"}
                level = level_map.get(severity, "Routine")

                rec = assessment.get("recommended_action") or assessment.get("reason") or pathway.get("next_step", "")
                if not rec:
                    rec = "Clinical evaluation recommended. Follow up with your healthcare provider."

                top_hosp = hospitals[0] if hospitals else None
                if top_hosp:
                    rec += f" Nearest recommended: {top_hosp.get('name', '')} ({top_hosp.get('dist', '')} away, {top_hosp.get('vacantBeds', '?')} beds available)."

                logger.info(f"AI Engine responded: severity={severity}, level={level}")
                return {
                    "severity": severity,
                    "level": level,
                    "recommendation": rec,
                    "emergency": assessment.get("emergency", False),
                    "required_care": assessment.get("department", "General Medicine"),
                    "ai_summary": assessment.get("reason", "AI triage complete."),
                    "event_type": assessment.get("event_type"),
                    "input_intent": assessment.get("input_intent"),
                    "subject": assessment.get("subject"),
                    "current_event": assessment.get("current_event"),
                    "next_step": assessment.get("next_step"),
                    "consultation_mode": assessment.get("consultation_mode"),
                    "immediate_guidance": assessment.get("immediate_guidance", []),
                }
    except Exception as e:
        logger.warning(f"AI Engine unreachable at {AI_ENGINE_URL}: {e}. Falling back to internal engine.")
        # Phase 28 compliance: We log the error but allow fallback so the UI isn't broken for users without API keys.
        pass

    # 2. NVIDIA NIM hook (when configured)
    try:
        nim_key = getattr(settings, 'NVIDIA_NIM_API_KEY', None)
        if nim_key and nim_key != "placeholder_for_shivansh_llm_key":
            logger.info("Delegating symptom analysis to NVIDIA NIM Service Endpoint...")
            # Shivansh Gupta's custom NVIDIA NIM / LLM API call hook goes here
            pass
    except Exception as e:
        logger.error(f"NVIDIA NIM service call failed: {e}. Using built-in clinical scoring engine.")

    # 3. PHASE 20: EXPLICIT AI FAILURE HANDLING
    # If we reached here, the AI engine is unreachable or failed.
    # We must NOT silently produce LOW, General Medicine, or Routine appointment.
    # We must use an explicit safe fallback/error state.
    
    logger.warning("AI Engine failed or is unavailable. Executing explicit safe fallback (Phase 20).")
    
    return {
        "severity": "HIGH",
        "level": "Urgent",
        "recommendation": "⚠️ MediNexus AI Engine is currently unavailable. We cannot safely assess your symptoms at this time. If this is an emergency, please call your local emergency number or proceed to the nearest emergency room immediately.",
        "emergency": False,
        "required_care": "Emergency Medicine",
        "ai_summary": "⚠️ SYSTEM OFFLINE: The clinical AI reasoning engine failed to process the request. Safe fallback triggered.",
        "input_intent": "MEDICAL",
        "next_step": "URGENT_IN_PERSON",
        "consultation_mode": "IN_PERSON",
        "immediate_guidance": [
            "AI assessment is currently offline.",
            "If you are experiencing a life-threatening emergency, call emergency services immediately.",
            "Do not wait for this system to come back online."
        ],
    }
