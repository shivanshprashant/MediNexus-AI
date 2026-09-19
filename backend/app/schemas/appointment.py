from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any

AptStatusType = Literal['TODAY', 'UPCOMING', 'COMPLETED', 'CANCELLED']

class AppointmentCreateRequest(BaseModel):
    doctor_id: Optional[str] = None
    patient_id: Optional[str] = None
    date: str
    time: str
    modality: str
    reason: str
    clinical_notes: Optional[str] = None

class AppointmentSchema(BaseModel):
    id: str
    bookingId: str
    name: str
    ageGender: str
    mrn: str
    department: str
    modality: str
    time: str
    dateLabel: str
    date: str
    status: AptStatusType
    reason: str
    initials: Optional[str] = None
    bgColor: Optional[str] = None
    clinicalBrief: Optional[str] = None
    doctor: Optional[Dict[str, Any]] = None
    coverage: Optional[Dict[str, Any]] = None

class AppointmentUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    status: Optional[AptStatusType] = None
    clinicalBrief: Optional[str] = None
