from schemas.health import HealthAssessment
from schemas.hospital import HospitalInfo
from hospital.pathway import normalize_department
from location.distance import calculate_distance


def find_department(
    hospital: HospitalInfo,
    department_name: str
):
    """
    Find a department inside a hospital.
    """

    for department in hospital.departments:
        if department.name.lower() == department_name.lower():
            return department

    return None


def calculate_hospital_score(
    assessment: HealthAssessment,
    hospital: HospitalInfo,
    department,
    distance_km: float
) -> int:
    """
    Calculate a hospital suitability score out of 100.

    The score considers:
    - Emergency capability
    - Emergency department support
    - Ambulance availability
    - Bed availability
    - Doctor availability
    - Distance from the patient
    """

    score = 0

    # -----------------------------------------------
    # Facility readiness / Emergency capability: 30 points
    # -----------------------------------------------
    if assessment.emergency:
        if hospital.emergency_available:
            score += 20
        if department.emergency_support:
            score += 10
    else:
        # Non-emergency readiness scoring
        if department.doctors_on_duty > 0:
            score += 15
        if hospital.emergency_available:
            score += 15

    # -----------------------------------------------
    # Ambulance: 10 points
    # -----------------------------------------------
    if hospital.ambulance_available:
        score += 10

    # -----------------------------------------------
    # Bed availability: 20 points
    # -----------------------------------------------
    if department.available_beds > 0:
        score += 15
        if department.available_beds >= 5:
            score += 5

    # -----------------------------------------------
    # Doctors on duty: 15 points
    # -----------------------------------------------
    if department.doctors_on_duty > 0:
        score += 10
        if department.doctors_on_duty >= 3:
            score += 5

    # -----------------------------------------------
    # Distance: 25 points
    # -----------------------------------------------
    if distance_km <= 5:
        score += 25
    elif distance_km <= 10:
        score += 20
    elif distance_km <= 20:
        score += 15
    elif distance_km <= 30:
        score += 10
    elif distance_km <= 50:
        score += 5

    # Clamp score to 0–100 range
    return max(0, min(100, score))


def recommend_hospital(
    assessment: HealthAssessment,
    hospitals: list[HospitalInfo],
    patient_latitude: float,
    patient_longitude: float
):
    """
    Select and rank suitable hospitals based on:

    - Required department
    - Emergency capability
    - Emergency support
    - Bed availability
    - Doctors on duty
    - Ambulance availability
    - Distance
    """

    # Normalize the department returned by the AI.
    normalized_department = normalize_department(
        assessment.department
    )

    # No recommendation if department is unknown.
    if normalized_department.value == "Undetermined":
        return []

    suitable_hospitals = []

    for hospital in hospitals:

        # Calculate actual distance from patient
        # to this hospital.
        distance = calculate_distance(
            patient_latitude,
            patient_longitude,
            hospital.latitude,
            hospital.longitude
        )

        # Find required department.
        department = find_department(
            hospital,
            normalized_department.value
        )

        if department is None:
            continue

        # Emergency requirements.
        if assessment.emergency:

            if not hospital.emergency_available:
                continue

            if not department.emergency_support:
                continue

            if department.available_beds <= 0:
                continue

        # Calculate hospital suitability.
        score = calculate_hospital_score(
            assessment,
            hospital,
            department,
            distance
        )

        suitable_hospitals.append(
            {
                "hospital": hospital,
                "department": department,
                "score": score,
                "distance_km": distance
            }
        )

    # Rank by suitability first.
    # If scores are equal, choose the nearer hospital.
    suitable_hospitals.sort(
        key=lambda item: (
            -item["score"],
            item["distance_km"]
        )
    )

    return suitable_hospitals