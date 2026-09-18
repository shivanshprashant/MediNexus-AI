from pydantic import BaseModel
from typing import Optional, Literal

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[Literal['patient', 'doctor', 'hospital_admin']] = 'patient'
    username: Optional[str] = None

class HospitalAdminLoginRequest(BaseModel):
    hospital_code: str
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str
    hospital_id: Optional[str] = None

class PatientRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    age: Optional[int] = 25
    dob: Optional[str] = None
    gender: Optional[Literal['Male', 'Female', 'Other']] = 'Female'
    blood: Optional[str] = 'O+'
    allergies: Optional[str] = ""
    meds: Optional[str] = ""
    history: Optional[str] = ""
    emergency_contact: Optional[str] = None
    hospital_id: Optional[str] = "hsp-001"


class DoctorRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    hospital_id: Optional[str] = None
    department_id: Optional[str] = None
    specialization: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = 0
    license: Optional[str] = None
    shift: Optional[str] = None
    room: Optional[str] = None
    dob: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: str
    new_password: str
    role: Optional[str] = "patient"
    username: Optional[str] = None

class PasswordResetResponse(BaseModel):
    message: str
    email: str


