from enum import Enum


class HealthcareDepartment(str, Enum):

    EMERGENCY_MEDICINE = "Emergency Medicine"
    GENERAL_MEDICINE = "General Medicine"
    CARDIOLOGY = "Cardiology"
    NEUROLOGY = "Neurology"
    ORTHOPEDICS = "Orthopedics"
    PEDIATRICS = "Pediatrics"
    GYNECOLOGY = "Gynecology"
    SURGERY = "Surgery"
    DERMATOLOGY = "Dermatology"
    ENT = "ENT"
    OPHTHALMOLOGY = "Ophthalmology"
    PSYCHIATRY = "Psychiatry"
    RADIOLOGY = "Radiology"
    PRIMARY_CARE = "Primary Care"
    UNDETERMINED = "Undetermined"