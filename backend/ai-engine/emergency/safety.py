from typing import Optional, List
from schemas.health import HealthAssessment

EMERGENCY_TRIGGERS = [
    # English
    "unconscious",
    "unresponsive",
    "not responding",
    "isn't responding",
    "isnt responding",
    "passed out",
    "fainted",
    "stopped breathing",
    "not breathing",
    "cannot breathe",
    "can't breathe",
    "difficulty breathing",
    "cardiac arrest",
    "heart attack",
    "severe bleeding",
    "bleeding heavily",
    "anaphylaxis",
    "seizure",
    "stroke",
    "collapsed",
    # Toxic Ingestion & Poisoning
    "drank floor cleaner",
    "drank cleaner",
    "drank bleach",
    "drank phenyl",
    "drank poison",
    "drank venom",
    "drank pesticide",
    "drank acid",
    "drank chemical",
    "drank liquid from under the sink",
    "toddler drank",
    "child drank",
    "baby drank",
    "infant drank",
    "swallowed cleaner",
    "swallowed bleach",
    "swallowed poison",
    "swallowed battery",
    "button battery",
    "toxic ingestion",
    "floor cleaner",
    "venomous floor cleaner",
    "venemous floor cleaner",
    "venomous liquid",
    "venemous liquid",
    "snake bite",
    "snakebite",
    "scorpion bite",
    "scorpion sting",
    "scorpian bite",
    "scorpian sting",
    "scorpion",
    "scorpian",
    "bichhu ne kaat liya",
    "saanp ne kaat liya",
    "zeher pee liya",
    "phenyl pee liya",
    # Surgical Abdomen
    "appendicitis",
    "appendix",
    "testicular torsion",
    "burst appendix",

    # Hindi (Devanagari script)
    "बेहोश",
    "होश में नहीं",
    "होश नहीं",
    "सांस लेने में बहुत दिक्कत",
    "सांस लेने में दिक्कत",
    "सांस नहीं आ रही",
    "सांस नहीं ले रहे",
    "सीने में बहुत तेज दर्द",
    "सीने में तेज दर्द",
    "दिल का दौरा",
    "खून बह रहा",

    # Hinglish (Roman Hindi)
    "unconscious hain",
    "unconscious hai",
    "is unconscious",
    "hosh mein nahi",
    "hosh me nahi",
    "saans lene mein problem",
    "saans lene mein dikkat",
    "saans nahi aa rahi",
    "chest mein bahut pain",
    "chest mein severe pain",
    "heart attack aaya",

    # Bengali
    "জ্ঞান হারিয়ে",
    "অজ্ঞান",
    "শ্বাসকষ্ট",

    # Tamil
    "சுயநினைவின்றி",
    "மயக்கம்",

    # Telugu
    "స్పృహ తప్పి",
    "శ్వాస తీసుకోలేకపోతున్నారు",
]


def get_emergency_guidance(text: str) -> List[str]:
    lowered = text.lower()
    if any(k in lowered for k in ["unconscious", "unresponsive", "not responding", "isn't responding", "isnt responding", "passed out", "fainted"]):
        return [
            "Contact local emergency services immediately.",
            "Do not leave the person alone.",
            "Check whether the person is breathing normally if safe to do so.",
            "If the person is not breathing normally and you know CPR, follow dispatcher instructions.",
            "Do not give food, drink, or medication to an unconscious person."
        ]
    elif any(k in lowered for k in ["breathing", "breathe"]):
        return [
            "Seek emergency medical help immediately.",
            "Keep the person in a position that helps them breathe, if conscious and able to do so.",
            "Loosen tight clothing around the neck and chest.",
            "Do not delay emergency care."
        ]
    elif any(k in lowered for k in ["bleeding", "blood"]):
        return [
            "Seek emergency medical help immediately.",
            "Apply firm direct pressure with clean material.",
            "Keep the affected area elevated if possible.",
            "Keep the person lying down and warm."
        ]
    elif any(k in lowered for k in ["cleaner", "phenyl", "poison", "bleach", "acid", "pesticide", "drank", "swallowed", "zeher", "battery"]):
        return [
            "Seek urgent professional emergency care immediately.",
            "CRITICAL: Do NOT induce vomiting, and do NOT give milk, salt water, or home remedies.",
            "Preserve product packaging or container for toxicological identification by medical responders.",
            "Check that patient is breathing and responsive."
        ]
    elif any(k in lowered for k in ["appendix", "appendicitis"]):
        return [
            "Proceed immediately to an Emergency Department with surgical facilities.",
            "CRITICAL: Strict NPO — do NOT give food, water, or liquids in case urgent surgery is required.",
            "Do NOT apply heating pads or warm compresses to the abdomen.",
            "Do NOT take laxatives, pain medicine, or enemas without physician instruction."
        ]
    return [
        "Contact local emergency services immediately.",
        "Do not leave the patient unattended.",
        "Remain calm and monitor vitals until professional help arrives."
    ]


def prescreen_emergency(text: str) -> Optional[HealthAssessment]:
    """
    Deterministic fast emergency pre-screening interceptor layer.
    Checks for immediate life-threatening natural language trigger phrases.
    """
    if not text:
        return None

    lowered = text.lower()
    for trigger in EMERGENCY_TRIGGERS:
        if trigger in lowered:
            guidance = get_emergency_guidance(lowered)
            return HealthAssessment(
                severity="EMERGENCY",
                emergency=True,
                department="Emergency Medicine",
                next_step="EMERGENCY",
                consultation_mode="NONE",
                recommended_action="Contact local emergency services and seek immediate professional medical care.",
                reason=f"Emergency pre-screening interceptor detected critical indicator '{trigger}'. Immediate medical evaluation required.",
                immediate_guidance=guidance,
                level="Emergency",
                rec="Contact local emergency services and seek immediate professional medical care."
            )
    return None


def validate_emergency_assessment(
    assessment: HealthAssessment,
    request_id: Optional[str] = None
) -> HealthAssessment:
    """
    Validate and normalize the emergency-related fields
    of an AI-generated healthcare assessment.
    Enforces strict bidirectional consistency:
    - emergency == True <=> severity == "EMERGENCY"
    - HIGH, MODERATE, LOW <=> emergency == False
    """
    if request_id:
        print(f"[{request_id}] SAFETY_LAYER_INPUT:\n{assessment.json()}", flush=True)

    # If the AI explicitly marks the case as an emergency,
    # emergency status takes priority over a lower severity.
    if assessment.emergency is True:
        if assessment.severity != "EMERGENCY":
            assessment.severity = "EMERGENCY"
            assessment.reason = (
                assessment.reason
                + " The case was also marked as requiring "
                "emergency attention, so the safety layer "
                "classified the severity as EMERGENCY."
            )

    # If severity is EMERGENCY, emergency must be true.
    if assessment.severity == "EMERGENCY":
        assessment.emergency = True
        assessment.next_step = "EMERGENCY"
        assessment.consultation_mode = "NONE"

    # For non-emergency severities, ensure emergency flag is False
    if assessment.severity in ["HIGH", "MODERATE", "LOW"]:
        assessment.emergency = False

    # Ensure immediate_guidance is populated for emergency cases
    if assessment.emergency and not assessment.immediate_guidance:
        assessment.immediate_guidance = [
            "Contact local emergency services immediately.",
            "Do not leave the patient unattended.",
            "Seek immediate professional medical care."
        ]

    if request_id:
        print(f"[{request_id}] SAFETY_LAYER_OUTPUT:\n{assessment.json()}", flush=True)

    return assessment