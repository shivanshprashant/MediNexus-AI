from pydantic import BaseModel
from typing import List, Optional, Literal

class DepartmentBedTypeSchema(BaseModel):
    id: str
    bedType: str
    total: int
    occupied: int
    available: int
    floorWard: str

class DepartmentBedUpdateSchema(BaseModel):
    occupied: int

class DepartmentDoctorSchema(BaseModel):
    id: str
    doctorCode: str
    name: str
    specialization: str
    qualification: str
    experienceYears: int
    contactPhone: str
    email: str
    shift: str
    availability: Literal['ON DUTY', 'OFF DUTY', 'ON LEAVE']

class DepartmentItemSchema(BaseModel):
    id: str
    code: str
    name: str
    description: str
    contactPhone: str
    locationFloor: str
    operatingHours: str
    is24x7: bool
    hasEmergencySupport: bool
    status: Literal['ACTIVE', 'INACTIVE']
    services: List[str] = []
    beds: List[DepartmentBedTypeSchema] = []
    doctors: List[DepartmentDoctorSchema] = []

class EmergencySetupConfigSchema(BaseModel):
    is24x7Emergency: bool
    departmentName: str
    emergencyContact: str
    ambulanceContact: Optional[str] = None
    totalEmergencyBeds: int
    availableEmergencyBeds: int
    traumaCareAvailable: bool
    ambulanceAvailable: bool
    emergencyDoctorsOnDutyCount: int

class HospitalLocationConfigSchema(BaseModel):
    address: str
    city: str
    state: str
    pincode: str
    latitude: str
    longitude: str
    emergencyEntranceLocation: str
    mainEntranceLocation: str
    contactInfo: str

class DetailedHospitalSchema(BaseModel):
    id: str
    hospitalCode: str
    name: str
    type: str
    phone: str
    emergencyPhone: str
    email: str
    website: Optional[str] = ""
    establishedYear: int
    employeeCount: int
    description: str
    location: HospitalLocationConfigSchema
    departments: List[DepartmentItemSchema] = []
    emergencyConfig: EmergencySetupConfigSchema
    globalServices: List[str] = []
    isOnboarded: bool = True
    adminName: str
    adminEmail: str

class HospitalSimpleSchema(BaseModel):
    id: str
    name: str
    dist: str
    time: str
    traffic: str
    address: str
    phone: str
    emergencyPhone: Optional[str] = None
    ambulancePhone: Optional[str] = None
    vacantBeds: int
    totalBeds: int
    erStatus: str

class HospitalCreateSchema(BaseModel):
    hospitalCode: Optional[str] = None
    name: str
    type: Optional[str] = "Multi-Specialty Hospital"
    phone: str
    emergencyPhone: str
    ambulancePhone: Optional[str] = None
    email: str
    website: Optional[str] = None
    establishedYear: Optional[int] = 2020
    employeeCount: Optional[int] = 100
    description: Optional[str] = "Multi-specialty hospital providing 24/7 care."
    address: str
    city: str
    state: str
    pincode: str
    adminName: str
    adminEmail: str
    adminPassword: Optional[str] = "password123"

