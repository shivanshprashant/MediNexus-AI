from schemas.pathway import HealthcareDepartment


DEPARTMENT_ALIASES = {
    "emergency": HealthcareDepartment.EMERGENCY_MEDICINE,
    "emergency department": HealthcareDepartment.EMERGENCY_MEDICINE,
    "emergency medicine": HealthcareDepartment.EMERGENCY_MEDICINE,
    "emergency room": HealthcareDepartment.EMERGENCY_MEDICINE,
    "er": HealthcareDepartment.EMERGENCY_MEDICINE,

    "general medicine": HealthcareDepartment.GENERAL_MEDICINE,
    "internal medicine": HealthcareDepartment.GENERAL_MEDICINE,
    "general physician": HealthcareDepartment.GENERAL_MEDICINE,
    "gp": HealthcareDepartment.GENERAL_MEDICINE,

    "primary care": HealthcareDepartment.PRIMARY_CARE,
    "cardiology": HealthcareDepartment.CARDIOLOGY,
    "neurology": HealthcareDepartment.NEUROLOGY,

    "orthopedics": HealthcareDepartment.ORTHOPEDICS,
    "orthopaedics": HealthcareDepartment.ORTHOPEDICS,

    "pediatrics": HealthcareDepartment.PEDIATRICS,
    "paediatrics": HealthcareDepartment.PEDIATRICS,

    "gynecology": HealthcareDepartment.GYNECOLOGY,
    "gynaecology": HealthcareDepartment.GYNECOLOGY,

    "surgery": HealthcareDepartment.SURGERY,
    "dermatology": HealthcareDepartment.DERMATOLOGY,
    "ent": HealthcareDepartment.ENT,
    "ophthalmology": HealthcareDepartment.OPHTHALMOLOGY,
    "psychiatry": HealthcareDepartment.PSYCHIATRY,
    "radiology": HealthcareDepartment.RADIOLOGY,
}



def normalize_department(
    department: str
) -> HealthcareDepartment:

    normalized = department.strip().lower()

    return DEPARTMENT_ALIASES.get(
        normalized,
        HealthcareDepartment.UNDETERMINED
    )