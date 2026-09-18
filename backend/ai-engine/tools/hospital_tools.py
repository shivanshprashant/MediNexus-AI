from schemas.health import HealthAssessment
from schemas.hospital import HospitalInfo
from hospital.recommendation import recommend_hospital


def find_suitable_hospital(
    assessment: HealthAssessment,
    hospitals: list[HospitalInfo],
    patient_latitude: float,
    patient_longitude: float
) -> list[dict]:
    """
    Find and rank suitable hospitals for the patient.
    """

    recommendations = recommend_hospital(
        assessment,
        hospitals,
        patient_latitude,
        patient_longitude
    )

    results = []

    for rank, item in enumerate(recommendations, start=1):

        hospital = item["hospital"]
        department = item["department"]
        distance_km = item["distance_km"]

        dist_str = hospital.dist_str or f"{distance_km:.1f} km"
        time_est = hospital.time_str or f"{max(2, int(distance_km * 2))} mins"

        results.append(
            {
                "rank": rank,
                "hospital_id": hospital.hospital_id,
                "hospital_name": hospital.name,
                "distance_km": distance_km,
                "department": department.name,
                "available_beds": department.available_beds,
                "doctors_on_duty": department.doctors_on_duty,
                "ambulance_available": hospital.ambulance_available,
                "suitability_score": item["score"],

                # Frontend UI compatibility attributes
                "id": hospital.hospital_id,
                "name": hospital.name,
                "dist": dist_str,
                "time": time_est,
                "traffic": hospital.traffic or "Clear",
                "address": hospital.address or "Main Medical Zone",
                "phone": hospital.phone or "+91 11 4000 0000",
                "vacantBeds": department.available_beds,
                "totalBeds": hospital.total_beds or 30,
                "erStatus": hospital.er_status or "EMERGENCY BAY OPEN"
            }
        )

    return results