from pydantic import BaseModel, Field
from typing import Optional, List


class PatientContext(BaseModel):
    age: Optional[int] = None

    gender: Optional[str] = None

    medical_conditions: List[str] = Field(default_factory=list)

    medications: List[str] = Field(default_factory=list)

    allergies: List[str] = Field(default_factory=list)

    previous_major_conditions: List[str] = Field(
        default_factory=list
    )