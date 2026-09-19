from typing import Literal, Optional, List
from pydantic import BaseModel, Field

NextStepType = Literal[
    "EMERGENCY",
    "URGENT_IN_PERSON",
    "ROUTINE_CONSULTATION",
    "VIDEO_PREFERRED",
    "VIDEO_OR_IN_PERSON"
]

ConsultationModeType = Literal[
    "NONE",
    "IN_PERSON",
    "VIDEO",
    "VIDEO_OR_IN_PERSON"
]


class HealthAssessment(BaseModel):
    severity: Literal[
        "LOW",
        "MODERATE",
        "HIGH",
        "EMERGENCY"
    ]

    emergency: bool

    department: str

    recommended_action: str

    reason: str

    immediate_guidance: List[str] = Field(default_factory=list)

    event_type: Optional[str] = None
    input_intent: Optional[Literal["MEDICAL", "NON_MEDICAL"]] = None
    subject: Optional[str] = None
    current_event: Optional[bool] = None

    next_step: Optional[NextStepType] = None
    consultation_mode: Optional[ConsultationModeType] = None

    # Frontend UI compatibility fields
    level: Optional[str] = None
    rec: Optional[str] = None
    summary: Optional[str] = None

    def model_post_init(self, __context):
        if not self.level:
            if self.severity == "EMERGENCY":
                self.level = "Emergency"
            elif self.severity == "HIGH":
                self.level = "Urgent"
            elif self.severity == "MODERATE":
                self.level = "Urgent"
            else:
                self.level = "Routine"
        if not self.rec:
            self.rec = self.recommended_action