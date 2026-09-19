from typing import List, Optional

from pydantic import BaseModel


class DepartmentInfo(BaseModel):
    name: str
    available_beds: int
    doctors_on_duty: int
    emergency_support: bool


class HospitalInfo(BaseModel):
    hospital_id: str
    name: str

    # Hospital location
    latitude: float
    longitude: float

    # Emergency capabilities
    emergency_available: bool
    ambulance_available: bool

    # Hospital departments
    departments: List[DepartmentInfo]

    # Additional frontend compatibility metadata
    address: Optional[str] = None
    phone: Optional[str] = None
    total_beds: Optional[int] = 30
    er_status: Optional[str] = "EMERGENCY BAY OPEN"
    dist_str: Optional[str] = None
    time_str: Optional[str] = None
    traffic: Optional[str] = "Clear"