from typing import Dict, Any
from schemas.health import HealthAssessment, NextStepType, ConsultationModeType


class PathwayResult:
    def __init__(
        self,
        next_step: NextStepType,
        consultation_mode: ConsultationModeType,
        target_department: str,
        recommendation_title: str,
        recommendation_summary: str,
        primary_action_label: str
    ):
        self.next_step = next_step
        self.consultation_mode = consultation_mode
        self.target_department = target_department
        self.recommendation_title = recommendation_title
        self.recommendation_summary = recommendation_summary
        self.primary_action_label = primary_action_label

    def to_dict(self) -> Dict[str, Any]:
        return {
            "next_step": self.next_step,
            "consultation_mode": self.consultation_mode,
            "target_department": self.target_department,
            "recommendation_title": self.recommendation_title,
            "recommendation_summary": self.recommendation_summary,
            "primary_action_label": self.primary_action_label,
        }


def resolve_pathway(assessment: HealthAssessment) -> PathwayResult:
    """
    Intelligent Healthcare Pathway Resolver.
    Converts validated HealthAssessment into a structured application pathway.
    """
    dept = assessment.department or "General Medicine"
    lowered_action = (assessment.recommended_action or "").lower()
    lowered_reason = (assessment.reason or "").lower()

    # Rule 1: Critical Emergency
    if assessment.emergency or assessment.severity == "EMERGENCY":
        assessment.next_step = "EMERGENCY"
        assessment.consultation_mode = "NONE"
        return PathwayResult(
            next_step="EMERGENCY",
            consultation_mode="NONE",
            target_department="Emergency Medicine",
            recommendation_title="🚨 Emergency Medical Attention Required",
            recommendation_summary="Critical status detected. Immediate emergency response protocol initiated.",
            primary_action_label="Dispatch Emergency Response"
        )

    # Rule 2: Urgent In-Person Evaluation
    if assessment.severity == "HIGH" or dept == "Emergency Medicine":
        assessment.next_step = "URGENT_IN_PERSON"
        assessment.consultation_mode = "IN_PERSON"
        return PathwayResult(
            next_step="URGENT_IN_PERSON",
            consultation_mode="IN_PERSON",
            target_department=dept,
            recommendation_title="🏥 Urgent In-Person Clinical Evaluation",
            recommendation_summary=f"Urgent clinical review recommended in {dept}.",
            primary_action_label="Find Urgent Care Hospital"
        )

    # Rule 3: Video Preferred (Dermatology, minor rashes, routine follow-ups, teleconsult)
    if dept == "Dermatology" or "video" in lowered_action or "teleconsult" in lowered_action or "remote" in lowered_reason:
        assessment.next_step = "VIDEO_PREFERRED"
        assessment.consultation_mode = "VIDEO"
        return PathwayResult(
            next_step="VIDEO_PREFERRED",
            consultation_mode="VIDEO",
            target_department=dept,
            recommendation_title="🎥 Video Consultation Recommended",
            recommendation_summary=f"An initial consultation in {dept} is suitable via secure video teleconsultation.",
            primary_action_label="Start Video Consultation"
        )

    # Rule 4: Choice of Video or In-Person (Primary Care / General Medicine / Psychiatry / Pediatrics)
    if dept in ["Primary Care", "General Medicine", "Psychiatry", "Pediatrics"] and assessment.severity == "LOW":
        assessment.next_step = "VIDEO_OR_IN_PERSON"
        assessment.consultation_mode = "VIDEO_OR_IN_PERSON"
        return PathwayResult(
            next_step="VIDEO_OR_IN_PERSON",
            consultation_mode="VIDEO_OR_IN_PERSON",
            target_department=dept,
            recommendation_title="Choice of Video or In-Person Consultation",
            recommendation_summary=f"You may choose between a video teleconsult or in-person clinic visit for {dept}.",
            primary_action_label="Select Consultation Mode"
        )

    # Rule 5: Routine In-Person Consultation
    assessment.next_step = "ROUTINE_CONSULTATION"
    assessment.consultation_mode = "IN_PERSON"
    return PathwayResult(
        next_step="ROUTINE_CONSULTATION",
        consultation_mode="IN_PERSON",
        target_department=dept,
        recommendation_title="👨‍⚕️ Routine Specialist Consultation",
        recommendation_summary=f"Schedule a routine consultation with a verified specialist in {dept}.",
        primary_action_label="View Recommended Doctors"
    )
