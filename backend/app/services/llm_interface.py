"""
MediNexus AI - LLM & AI Core Integration Service Contract Boundary
------------------------------------------------------------------
NOTE: This module defines the service boundary and integration interface for the LLM / NVIDIA NIM engine.
The actual LLM implementation, NVIDIA NIM model orchestration, and medical context prompt engineering
are owned and implemented by Shivansh Gupta.

Backend functions call `analyze_symptom_with_llm()` which acts as a clean contract boundary.
"""

import logging
import httpx
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("medinexus.llm_interface")

import os

# AI Engine base URL
AI_ENGINE_URL = os.getenv("AI_ENGINE_URL", "http://localhost:8082")

async def analyze_symptom_with_llm(symptom_text: str, patient_medical_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    LLM Service Interface Boundary — proxies to the AI Engine at port 8080.
    Falls back to structured keyword-based response if AI engine is unreachable.

    Contract Parameters:
    - symptom_text (str): Patient's complaint input (text or speech-to-text transcript)
    - patient_medical_context (dict): Optional patient history, allergies, chronic conditions

    Expected Return Contract:
    - severity: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY'
    - level: 'Routine' | 'Urgent' | 'Emergency'
    - recommendation: Actionable medical advice string (with disclaimer)
    - emergency_triggered: bool
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

                # Map AI engine response to our contract format
                severity = assessment.get("severity", "MODERATE")
                level_map = {"EMERGENCY": "Emergency", "HIGH": "Urgent", "MODERATE": "Routine", "LOW": "Routine"}
                level = level_map.get(severity, "Routine")

                rec = assessment.get("recommended_action") or assessment.get("reason") or pathway.get("next_step", "")
                if not rec:
                    rec = "Clinical evaluation recommended. Follow up with your healthcare provider."

                # Enrich recommendation with nearest hospital suggestion
                top_hosp = hospitals[0] if hospitals else None
                if top_hosp:
                    rec += f" Nearest recommended: {top_hosp.get('name', '')} ({top_hosp.get('dist', '')} away, {top_hosp.get('vacantBeds', '?')} beds available)."

                logger.info(f"AI Engine responded: severity={severity}, level={level}")
                return {
                    "severity": severity,
                    "level": level,
                    "recommendation": rec,
                    "emergency_triggered": assessment.get("emergency", False),
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
        logger.warning(f"AI Engine unreachable at {AI_ENGINE_URL}: {e}. Using fallback triage.")

    # 2. NVIDIA NIM hook (when Shivansh Gupta's key is configured)
    if settings.NVIDIA_NIM_API_KEY and settings.NVIDIA_NIM_API_KEY != "placeholder_for_shivansh_llm_key":
        try:
            logger.info("Delegating symptom analysis to NVIDIA NIM Service Endpoint...")
            # Shivansh Gupta's custom NVIDIA NIM / LLM API call hook goes here:
            # response = await call_nvidia_nim_api(symptom_text, patient_medical_context)
            pass
        except Exception as e:
            logger.error(f"NVIDIA NIM service call failed: {e}. Falling back to structured contract response.")

    # 3. Keyword-based fallback when AI engine is down
    text_lower = symptom_text.lower()
    
    # Handle non-medical intent explicitly in fallback if obvious
    if any(kw in text_lower for kw in ["love", "hi", "hello", "how are you", "movie", "song", "weather"]):
        return {
            "severity": "LOW",
            "level": "Routine",
            "recommendation": "This appears to be a non-medical request. MediNexus is designed for clinical triage.",
            "emergency_triggered": False,
            "required_care": "Undetermined",
            "ai_summary": "Non-medical query detected.",
            "input_intent": "NON_MEDICAL",
            "consultation_mode": "NONE",
            "immediate_guidance": []
        }
        
    if any(kw in text_lower for kw in ["chest", "dizz", "unconscious", "breath", "heart", "stroke", "bleed", "faint", "seize", "collapse", "snake", "accident"]):
        return {
            "severity": "EMERGENCY",
            "level": "Emergency",
            "recommendation": "Immediate threat detected. Do not drive yourself — call emergency services.",
            "emergency_triggered": True,
            "required_care": "Emergency Medicine",
            "ai_summary": "Patient presented with high-risk symptoms. Recommended STAT ER evaluation.",
            "input_intent": "MEDICAL",
            "next_step": "EMERGENCY",
            "consultation_mode": "NONE",
            "immediate_guidance": ["Call local emergency hotline", "Remain seated or lying down"]
        }
    elif any(kw in text_lower for kw in ["fever", "pain", "headache", "nausea", "vomit", "sweat", "weak"]):
        return {
            "severity": "MODERATE",
            "level": "Urgent",
            "recommendation": "Moderate symptom presentation. Consult a physician within 24 hours. Stay hydrated and rest.",
            "emergency_triggered": False,
            "required_care": "General Medicine",
            "ai_summary": "Moderate clinical presentation. Monitor vitals and schedule urgent OPD visit.",
            "input_intent": "MEDICAL",
            "next_step": "URGENT_IN_PERSON",
            "consultation_mode": "IN_PERSON",
            "immediate_guidance": ["Rest", "Monitor temperature"]
        }
    else:
        return {
            "severity": "LOW",
            "level": "Routine",
            "recommendation": "Symptom evaluation indicates routine presentation. Hydration & monitoring recommended. Book a regular appointment if symptoms persist.",
            "emergency_triggered": False,
            "required_care": "General Medicine",
            "ai_summary": "Stable clinical presentation. Regular outpatient follow-up advised.",
            "input_intent": "MEDICAL",
            "next_step": "ROUTINE_CONSULTATION",
            "consultation_mode": "VIDEO_OR_IN_PERSON",
            "immediate_guidance": []
        }
