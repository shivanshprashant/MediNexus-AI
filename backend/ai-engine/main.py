import sys

from llm.analyzer import analyze_patient
from schemas.patient import PatientContext
from schemas.hospital import HospitalInfo, DepartmentInfo

from emergency.safety import validate_emergency_assessment
from hospital.recommendation import recommend_hospital
from tools.hospital_tools import find_suitable_hospital

PATIENT_LATITUDE = 23.2599
PATIENT_LONGITUDE = 77.4126

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


# --------------------------------------------------
# PATIENT
# --------------------------------------------------

patient = PatientContext(
    age=58,
    gender="Male",
    medical_conditions=[
        "Hypertension"
    ],
    medications=[
        "Amlodipine"
    ],
    allergies=[
        "Penicillin"
    ],
    previous_major_conditions=[
        "Previous cardiac condition"
    ]
)


patient_input = """
The patient suddenly developed severe chest discomfort,
heavy sweating, and difficulty breathing.
"""


from hospital.mock_data import DEFAULT_HOSPITALS

hospitals = DEFAULT_HOSPITALS



# --------------------------------------------------
# AI ASSESSMENT
# --------------------------------------------------

print("\nMediNexus AI")
print("------------------------------")
print("Analyzing patient information...\n")


assessment = analyze_patient(
    patient_input=patient_input,
    patient_context=patient
)


print("Raw AI Assessment:")
print(assessment)


assessment = validate_emergency_assessment(
    assessment
)


print("\nValidated Assessment:")
print(assessment)

print("\nSafety validation passed.")


# --------------------------------------------------
# HOSPITAL RECOMMENDATION
# --------------------------------------------------

recommendations = find_suitable_hospital(
    assessment,
    hospitals,
    PATIENT_LATITUDE,
    PATIENT_LONGITUDE
)


print("\nSuitable Hospitals:")
print("------------------------------")


if not recommendations:

    print("No suitable hospital found.")

else:

    for hospital in recommendations:

        print(f"Hospital: {hospital['hospital_name']}")
        print(f"Distance: {hospital['distance_km']} km")
        print(f"Department: {hospital['department']}")
        print(f"Available beds: {hospital['available_beds']}")
        print(f"Doctors on duty: {hospital['doctors_on_duty']}")
        print(f"Ambulance available: {hospital['ambulance_available']}")
        print(f"Suitability Score: {hospital['suitability_score']}")

        print("------------------------------")