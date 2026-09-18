import pytest
from schemas.health import HealthAssessment
from emergency.safety import validate_emergency_assessment
from hospital.pathway import normalize_department
from schemas.pathway import HealthcareDepartment
from location.distance import calculate_distance
from schemas.hospital import HospitalInfo, DepartmentInfo
from hospital.recommendation import calculate_hospital_score, recommend_hospital


def test_safety_emergency_upgrade():
    assessment = HealthAssessment(
        severity="MODERATE",
        emergency=True,
        department="Emergency Medicine",
        recommended_action="Seek emergency care",
        reason="Chest discomfort"
    )
    validated = validate_emergency_assessment(assessment)
    assert validated.severity == "EMERGENCY"
    assert validated.emergency is True


def test_safety_severity_emergency_enforcement():
    assessment = HealthAssessment(
        severity="EMERGENCY",
        emergency=False,
        department="Emergency Medicine",
        recommended_action="Seek emergency care",
        reason="Unconscious patient"
    )
    validated = validate_emergency_assessment(assessment)
    assert validated.emergency is True
    assert validated.severity == "EMERGENCY"


def test_department_normalization():
    assert normalize_department("ER") == HealthcareDepartment.EMERGENCY_MEDICINE
    assert normalize_department("Emergency Department") == HealthcareDepartment.EMERGENCY_MEDICINE
    assert normalize_department("Internal Medicine") == HealthcareDepartment.GENERAL_MEDICINE
    assert normalize_department("Orthopaedics") == HealthcareDepartment.ORTHOPEDICS
    assert normalize_department("Unknown Specialty") == HealthcareDepartment.UNDETERMINED


def test_haversine_distance():
    # Distance between Bhopal center and nearby location (~0 km)
    dist_same = calculate_distance(23.2599, 77.4126, 23.2599, 77.4126)
    assert dist_same == 0.0

    # Approx 55 km distance
    dist_far = calculate_distance(23.2599, 77.4126, 23.6000, 77.8000)
    assert dist_far > 50.0


def test_hospital_recommendation_and_scoring():
    assessment = HealthAssessment(
        severity="EMERGENCY",
        emergency=True,
        department="Cardiology",
        recommended_action="Immediate care",
        reason="Heart attack symptoms"
    )

    h1 = HospitalInfo(
        hospital_id="H1",
        name="Emergency Cardio Hub",
        latitude=23.2599,
        longitude=77.4126,
        emergency_available=True,
        ambulance_available=True,
        departments=[
            DepartmentInfo(
                name="Cardiology",
                available_beds=10,
                doctors_on_duty=4,
                emergency_support=True
            )
        ]
    )

    h2 = HospitalInfo(
        hospital_id="H2",
        name="No Bed Hospital",
        latitude=23.2599,
        longitude=77.4126,
        emergency_available=True,
        ambulance_available=True,
        departments=[
            DepartmentInfo(
                name="Cardiology",
                available_beds=0,
                doctors_on_duty=2,
                emergency_support=True
            )
        ]
    )

    recommendations = recommend_hospital(assessment, [h1, h2], 23.2599, 77.4126)
    assert len(recommendations) == 1
    assert recommendations[0]["hospital"].hospital_id == "H1"
    assert recommendations[0]["score"] == 100
