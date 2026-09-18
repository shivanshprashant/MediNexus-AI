import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from schemas.health import HealthAssessment
from emergency.safety import validate_emergency_assessment
from hospital.pathway import normalize_department
from schemas.pathway import HealthcareDepartment
from location.distance import calculate_distance
from schemas.hospital import HospitalInfo, DepartmentInfo
from hospital.recommendation import calculate_hospital_score, recommend_hospital


from emergency.safety import prescreen_emergency
from llm.analyzer import generate_doctor_patient_summary
from tools.hospital_tools import find_suitable_hospital


def run_all_tests():
    print("Running MediNexus AI Core Unit Tests...")

    # Test 1: Emergency safety upgrade
    a1 = HealthAssessment(
        severity="MODERATE",
        emergency=True,
        department="Emergency Medicine",
        recommended_action="Seek emergency care",
        reason="Chest discomfort"
    )
    v1 = validate_emergency_assessment(a1)
    assert v1.severity == "EMERGENCY", f"Expected EMERGENCY, got {v1.severity}"
    assert v1.emergency is True
    print("[PASS] Test 1: Emergency safety severity upgrade")

    # Test 2: Severity EMERGENCY forces emergency=True
    a2 = HealthAssessment(
        severity="EMERGENCY",
        emergency=False,
        department="Emergency Medicine",
        recommended_action="Seek emergency care",
        reason="Unconscious patient"
    )
    v2 = validate_emergency_assessment(a2)
    assert v2.emergency is True, "Expected emergency to be True"
    assert v2.severity == "EMERGENCY"
    print("[PASS] Test 2: Severity EMERGENCY forces emergency=True")

    # Test 3: Department normalization
    assert normalize_department("ER") == HealthcareDepartment.EMERGENCY_MEDICINE
    assert normalize_department("Emergency Department") == HealthcareDepartment.EMERGENCY_MEDICINE
    assert normalize_department("Internal Medicine") == HealthcareDepartment.GENERAL_MEDICINE
    assert normalize_department("Orthopaedics") == HealthcareDepartment.ORTHOPEDICS
    assert normalize_department("Unknown Specialty") == HealthcareDepartment.UNDETERMINED
    print("[PASS] Test 3: Department alias normalization")

    # Test 4: Haversine distance
    d1 = calculate_distance(23.2599, 77.4126, 23.2599, 77.4126)
    assert d1 == 0.0, f"Expected 0.0, got {d1}"
    d2 = calculate_distance(23.2599, 77.4126, 23.6000, 77.8000)
    assert d2 > 50.0, f"Expected > 50.0, got {d2}"
    print("[PASS] Test 4: Haversine distance calculation")

    # Test 5: Hospital recommendation & eligibility rejection
    a3 = HealthAssessment(
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

    recs = recommend_hospital(a3, [h1, h2], 23.2599, 77.4126)
    assert len(recs) == 1, f"Expected 1 suitable hospital, got {len(recs)}"
    assert recs[0]["hospital"].hospital_id == "H1"
    assert recs[0]["score"] == 100, f"Expected score 100, got {recs[0]['score']}"
    print("[PASS] Test 5: Hospital eligibility filtering & 0-100 suitability ranking")

    # Test 6: Fast Emergency Interceptor Natural Language Triggers
    nl_cases = [
        "My father is unconscious",
        "My father isn't responding",
        "My dad suddenly became unconscious",
        "He passed out and isn't waking up",
        "Severe difficulty breathing and cardiac arrest"
    ]
    for expr in nl_cases:
        p_res = prescreen_emergency(expr)
        assert p_res is not None, f"Failed to detect emergency for: {expr}"
        assert p_res.emergency is True, f"Expected emergency True for: {expr}"
        assert p_res.severity == "EMERGENCY", f"Expected EMERGENCY for: {expr}"
        assert p_res.department == "Emergency Medicine"
        assert len(p_res.immediate_guidance) > 0, f"Missing immediate_guidance for: {expr}"

    print("[PASS] Test 6: Natural language emergency triggers & immediate guidance generation")

    # Test 7: Zero bed hospital and non-emergency capability rejection
    h_no_emer = HospitalInfo(
        hospital_id="H3",
        name="No Emergency Capability Clinic",
        latitude=23.2599,
        longitude=77.4126,
        emergency_available=False,
        ambulance_available=False,
        departments=[
            DepartmentInfo(
                name="Cardiology",
                available_beds=10,
                doctors_on_duty=4,
                emergency_support=False
            )
        ]
    )

    recs_rej = recommend_hospital(a3, [h2, h_no_emer], 23.2599, 77.4126)
    assert len(recs_rej) == 0, f"Expected 0 suitable hospitals for zero-bed/no-emergency, got {len(recs_rej)}"
    print("[PASS] Test 7: Hospital rejection (zero beds / no emergency capability)")

    # Test 8: Doctor Patient Summary & Frontend formatting
    formatted_hospitals = find_suitable_hospital(a3, [h1], 23.2599, 77.4126)
    assert len(formatted_hospitals) == 1
    assert "id" in formatted_hospitals[0]
    assert "vacantBeds" in formatted_hospitals[0]
    assert "dist" in formatted_hospitals[0]
    print("[PASS] Test 8: Frontend UI hospital format compatibility")

    summary = generate_doctor_patient_summary({"name": "Test Patient", "reason": "Chest pain"})
    assert summary["patient_name"] == "Test Patient"
    assert "disclaimer" in summary
    print("[PASS] Test 9: Doctor AI Patient Summary generation")

    print("\nALL CORE UNIT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_all_tests()


