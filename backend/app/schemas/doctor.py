from pydantic import BaseModel
from typing import Optional, Literal

class DoctorBase(BaseModel):
    id: str
    doctorCode: str
    name: str
    specialization: str
    qualification: Optional[str] = None
    experienceYears: Optional[int] = 0
    contactPhone: Optional[str] = None
    email: Optional[str] = None
    shift: Optional[str] = None
    availability: Literal['ON DUTY', 'OFF DUTY', 'ON LEAVE'] = 'ON DUTY'
    title: Optional[str] = None
    facility: Optional[str] = None
    rating: Optional[str] = "4.9"
    reviews: Optional[str] = "(100+ reviews)"
    copay: Optional[str] = "₹800 Fee"
    photo: Optional[str] = None
    license: Optional[str] = None
    room: Optional[str] = None
    dob: Optional[str] = None

class DoctorAvailabilityUpdate(BaseModel):
    availability: Literal['ON DUTY', 'OFF DUTY', 'ON LEAVE']

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    facility: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    license: Optional[str] = None
    room: Optional[str] = None
    shift: Optional[str] = None
    contactPhone: Optional[str] = None
    availability: Optional[Literal['ON DUTY', 'OFF DUTY', 'ON LEAVE']] = None
    photo: Optional[str] = None
    dob: Optional[str] = None

class DoctorReviewCreateRequest(BaseModel):
    appointment_id: str
    rating: float
    comment: Optional[str] = None

class DoctorReviewResponse(BaseModel):
    id: str
    message: str
    doctor_id: str
    appointment_id: str
    rating: float
    updated_average_rating: str
    updated_reviews_count: str

