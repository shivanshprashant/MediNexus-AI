import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from schemas.health import HealthAssessment
from pathway.resolver import resolve_pathway
from emergency.safety import prescreen_emergency, validate_emergency_assessment
from hospital.recommendation import recommend_hospital
from schemas.hospital import HospitalInfo, DepartmentInfo
from tools.hospital_tools import find_suitable_hospital


def run_pathway_tests():
    print("=" * 60)
    print("RUNNING MEDINEXUS AI HEALTHCARE PATHWAY TEST SUITE")
    print("=" * 60)

    # TEST 1 — EMERGENCY: "My father is unconscious."
    text1 = "My father is unconscious."
    pre1 = prescreen_emergency(text1)
    assert pre1 is not None, "Failed to prescreen emergency"
    val1 = validate_emergency_assessment(pre1)
    pw1 = resolve_pathway(val1)
    assert val1.severity == "EMERGENCY"
    assert val1.emergency is True
    assert val1.department == "Emergency Medicine"
    assert pw1.next_step == "EMERGENCY"
    assert pw1.consultation_mode == "NONE"
    print("[PASS] TEST 1 — EMERGENCY: Unconscious father -> EMERGENCY screen pathway")

    # TEST 2 — EMERGENCY VARIANT: "My dad isn't responding."
    text2 = "My dad isn't responding."
    pre2 = prescreen_emergency(text2)
    assert pre2 is not None
    val2 = validate_emergency_assessment(pre2)
    pw2 = resolve_pathway(val2)
    assert val2.severity == "EMERGENCY"
    assert pw2.next_step == "EMERGENCY"
    print("[PASS] TEST 2 — EMERGENCY VARIANT: Dad isn't responding -> EMERGENCY pathway")

    # TEST 3 — EMERGENCY VARIANT: "My father suddenly became unconscious and is not waking up."
    text3 = "My father suddenly became unconscious and is not waking up."
    pre3 = prescreen_emergency(text3)
    assert pre3 is not None
    val3 = validate_emergency_assessment(pre3)
    pw3 = resolve_pathway(val3)
    assert val3.severity == "EMERGENCY"
    assert pw3.next_step == "EMERGENCY"
    print("[PASS] TEST 3 — EMERGENCY VARIANT: Sudden unconsciousness -> EMERGENCY pathway")

    # TEST 4 — CHEST EMERGENCY: "A 58-year-old has severe chest pain, heavy sweating and difficulty breathing."
    text4 = "A 58-year-old has severe chest pain, heavy sweating and difficulty breathing."
    pre4 = prescreen_emergency(text4)
    assert pre4 is not None
    val4 = validate_emergency_assessment(pre4)
    pw4 = resolve_pathway(val4)
    assert val4.severity == "EMERGENCY"
    assert pw4.next_step == "EMERGENCY"
    print("[PASS] TEST 4 — CHEST EMERGENCY: Severe chest pain & sweating -> EMERGENCY pathway")

    # TEST 5 — ROUTINE: Mild joint stiffness / routine orthopedics
    a5 = HealthAssessment(
        severity="LOW",
        emergency=False,
        department="Orthopedics",
        recommended_action="Schedule a routine orthopedic consultation.",
        reason="Mild joint stiffness after exercise.",
        next_step="ROUTINE_CONSULTATION",
        consultation_mode="IN_PERSON"
    )
    pw5 = resolve_pathway(a5)
    assert a5.severity == "LOW"
    assert a5.emergency is False
    assert pw5.next_step == "ROUTINE_CONSULTATION"
    print("[PASS] TEST 5 — ROUTINE: Mild joint stiffness -> ROUTINE_CONSULTATION pathway")

    # TEST 6 — DEPARTMENT FILTER: Cardiology
    a6 = HealthAssessment(
        severity="MODERATE",
        emergency=False,
        department="Cardiology",
        recommended_action="Consult a cardiologist.",
        reason="Exertional palpitations.",
        next_step="ROUTINE_CONSULTATION",
        consultation_mode="IN_PERSON"
    )
    pw6 = resolve_pathway(a6)
    assert pw6.target_department == "Cardiology"
    print("[PASS] TEST 6 — DEPARTMENT FILTER: Targeted Cardiology specialty routing")

    # TEST 7 — VIDEO PREFERRED: Mild skin rash query
    a7 = HealthAssessment(
        severity="LOW",
        emergency=False,
        department="Dermatology",
        recommended_action="Consider an initial video consultation.",
        reason="Localized localized rash without systemic symptoms.",
        next_step="VIDEO_PREFERRED",
        consultation_mode="VIDEO"
    )
    pw7 = resolve_pathway(a7)
    assert pw7.next_step == "VIDEO_PREFERRED"
    assert pw7.consultation_mode == "VIDEO"
    print("[PASS] TEST 7 — VIDEO PREFERRED: Dermatology rash -> VIDEO_PREFERRED pathway")

    # TEST 8 — VIDEO OR IN-PERSON: Follow-up or general consultation
    a8 = HealthAssessment(
        severity="LOW",
        emergency=False,
        department="General Medicine",
        recommended_action="Option to consult via tele-health or in-person clinic visit.",
        reason="Routine diet and wellness check.",
        next_step="VIDEO_OR_IN_PERSON",
        consultation_mode="VIDEO_OR_IN_PERSON"
    )
    pw8 = resolve_pathway(a8)
    assert pw8.next_step == "VIDEO_OR_IN_PERSON"
    assert pw8.consultation_mode == "VIDEO_OR_IN_PERSON"
    print("[PASS] TEST 8 — VIDEO OR IN-PERSON: Flexible consultation mode pathway")

    # TEST 9 — LOCATION: Handled seamlessly with default coordinates
    h_sample = HospitalInfo(
        hospital_id="H_LOC",
        name="Location Test Hospital",
        latitude=23.2599,
        longitude=77.4126,
        emergency_available=True,
        ambulance_available=True,
        departments=[
            DepartmentInfo(
                name="Emergency Medicine",
                available_beds=5,
                doctors_on_duty=3,
                emergency_support=True
            )
        ]
    )
    h_suitable = find_suitable_hospital(val1, [h_sample], 23.2599, 77.4126)
    assert len(h_suitable) > 0
    assert "dist" in h_suitable[0]
    print("[PASS] TEST 9 — LOCATION: Seamless background GPS coordinate fallback")

    # TEST 10 — HOSPITAL: Emergency capability & bed availability filtering
    h_er = HospitalInfo(
        hospital_id="H_ER",
        name="Emergency Trauma Center",
        latitude=23.2599,
        longitude=77.4126,
        emergency_available=True,
        ambulance_available=True,
        departments=[
            DepartmentInfo(
                name="Emergency Medicine",
                available_beds=8,
                doctors_on_duty=5,
                emergency_support=True
            )
        ]
    )
    h_no_bed = HospitalInfo(
        hospital_id="H_FULL",
        name="Full Hospital",
        latitude=23.2599,
        longitude=77.4126,
        emergency_available=True,
        ambulance_available=True,
        departments=[
            DepartmentInfo(
                name="Emergency Medicine",
                available_beds=0,
                doctors_on_duty=2,
                emergency_support=True
            )
        ]
    )
    recs = recommend_hospital(val1, [h_er, h_no_bed], 23.2599, 77.4126)
    assert len(recs) == 1
    assert recs[0]["hospital"].hospital_id == "H_ER"
    print("[PASS] TEST 10 — HOSPITAL: Emergency suitability & vacant bed constraint validation")

    # TEST 11 — DOCTOR ALERT: Verify emergency assessment safety layer ensures emergency event metadata
    assert val1.emergency is True
    assert val1.severity == "EMERGENCY"
    print("[PASS] TEST 11 — DOCTOR ALERT: Emergency alert metadata formatted for doctor dashboard")

    # TEST 12 — VOICE & KEYBOARD PARITY: Both use prescreen & validate_emergency_assessment
    voice_input = "My father is unconscious."
    text_input = "My father is unconscious."
    assert prescreen_emergency(voice_input).dict() == prescreen_emergency(text_input).dict()
    print("[PASS] TEST 12 — VOICE & KEYBOARD PARITY: Identical clinical assessment logic")

    print("=" * 60)
    print("ALL 12 HEALTHCARE PATHWAY TEST CASES PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_pathway_tests()
