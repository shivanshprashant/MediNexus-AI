from fastapi import APIRouter
from app.schemas.emergency import SymptomAnalysisRequest, SymptomAnalysisResponse
from app.services.llm_interface import analyze_symptom_with_llm

router = APIRouter(prefix="/ai", tags=["AI & LLM Boundary"])

@router.post("/symptom-analysis", response_model=SymptomAnalysisResponse)
async def symptom_analysis_boundary(req: SymptomAnalysisRequest):
    """
    Symptom Triage API Endpoint — public clinical assessment utility.
    Uses the multi-factor clinical scoring engine (or proxies to external AI if available).
    No authentication required as this doesn't access any patient records.
    """
    res = await analyze_symptom_with_llm(req.symptom_text, {"medical_context": req.medical_context})
    return SymptomAnalysisResponse(
        severity=res.get("severity", "MODERATE"),
        level=res.get("level", "Routine"),
        recommendation=res.get("recommendation", "Clinical consultation advised."),
        emergency=res.get("emergency", False),
        required_care=res.get("required_care", "General Medicine"),
        ai_summary=res.get("ai_summary", "Automated clinical triage synthesis complete."),
        event_type=res.get("event_type"),
        input_intent=res.get("input_intent"),
        subject=res.get("subject"),
        current_event=res.get("current_event"),
        next_step=res.get("next_step"),
        consultation_mode=res.get("consultation_mode"),
        immediate_guidance=res.get("immediate_guidance")
    )
