from pydantic import BaseModel
from typing import Optional, Literal

SeverityType = Literal['LOW', 'MODERATE', 'HIGH', 'EMERGENCY']
StatusType = Literal['REQUEST CREATED', 'HOSPITAL NOTIFIED', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'REJECTED', 'REDIRECTED', 'RESOLVED', 'DISCHARGED']

class EmergencySOSCreateRequest(BaseModel):
    mode: Literal['drive-in', 'ambulance'] = 'drive-in'
    target_hospital_id: Optional[str] = None
    complaint: Optional[str] = 'Acute emergency symptom presentation'
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    age_gender: Optional[str] = None
    medical_info: Optional[str] = None
    ambulance_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    ambulance_type: Optional[str] = None
    patient_location: Optional[str] = None
    patient_latitude: Optional[float] = None
    patient_longitude: Optional[float] = None

class EmergencyRequestSchema(BaseModel):
    id: str
    patientId: str
    patientName: str
    ageGender: str
    severity: SeverityType
    requiredCare: str
    requestTime: str
    timestamp: str
    status: StatusType
    complaint: str
    aiAssessment: str
    aiRecommendation: str
    aiSummary: str
    medicalInfo: str
    allocatedBed: Optional[str] = None
    emergencyContact: Optional[str] = None
    ambulanceContact: Optional[str] = None
    redirectedHospitalId: Optional[str] = None
    redirectedHospitalName: Optional[str] = None
    redirectedHospitalAddress: Optional[str] = None
    mode: Optional[str] = 'drive-in'
    ambulanceNumber: Optional[str] = None
    driverName: Optional[str] = None
    driverPhone: Optional[str] = None
    ambulanceType: Optional[str] = None
    patientLocation: Optional[str] = None
    patientLatitude: Optional[float] = None
    patientLongitude: Optional[float] = None
    mapsLink: Optional[str] = None

class EmergencyStatusUpdate(BaseModel):
    status: StatusType
    allocatedBed: Optional[str] = None
    redirectedHospitalId: Optional[str] = None
    redirectedHospitalName: Optional[str] = None
    redirectedHospitalAddress: Optional[str] = None
    ambulanceNumber: Optional[str] = None
    driverName: Optional[str] = None
    driverPhone: Optional[str] = None
    ambulanceType: Optional[str] = None

class SymptomAnalysisRequest(BaseModel):
    symptom_text: str
    medical_context: Optional[str] = ""

class SymptomAnalysisResponse(BaseModel):
    severity: SeverityType
    level: Literal['Routine', 'Urgent', 'Emergency']
    recommendation: str
    emergency_triggered: bool
    required_care: str
    ai_summary: str
    event_type: Optional[str] = None
    input_intent: Optional[str] = None
    subject: Optional[str] = None
    current_event: Optional[bool] = None
    next_step: Optional[str] = None
    consultation_mode: Optional[str] = None
    immediate_guidance: Optional[list] = None
