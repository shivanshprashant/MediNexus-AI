from pydantic import BaseModel
from typing import Optional, Literal

class PatientBase(BaseModel):
    id: str
    mrn: str
    name: str
    dept: str = "Cardiology"
    age: int
    dob: Optional[str] = None
    gender: Literal['Male', 'Female', 'Other']
    blood: str
    priority: Literal['HIGH', 'NORMAL'] = "NORMAL"
    status: Literal['WAITING', 'COMPLETED', 'IN_CONSULTANCY', 'IN_CONSULTATION'] = "WAITING"
    lastVisit: Optional[str] = None
    nextAppointment: Optional[str] = None
    allergies: Optional[str] = ""
    meds: Optional[str] = ""
    history: Optional[str] = ""
    reason: Optional[str] = ""
    recommendation: Optional[str] = ""
    heartRate: Optional[str] = "72 bpm"
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    photo: Optional[str] = None
    hospital_id: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    allergies: Optional[str] = None
    meds: Optional[str] = None
    history: Optional[str] = None
    age: Optional[int] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood: Optional[str] = None
    emergency_contact: Optional[str] = None
    photo: Optional[str] = None
    hospital_id: Optional[str] = None
