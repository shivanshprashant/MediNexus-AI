from schemas.hospital import HospitalInfo, DepartmentInfo

DEFAULT_HOSPITALS = [
    HospitalInfo(
        hospital_id="hosp-1",
        name="CityCare Hospital (HSP-001)",
        latitude=23.2599,
        longitude=77.4126,
        emergency_available=True,
        ambulance_available=True,
        address="Plot 14, Sector 44, New Delhi",
        phone="+91 11 4910 2000",
        total_beds=24,
        er_status="LEVEL 1 TRAUMA • OPEN 24/7",
        dist_str="1.8 km",
        time_str="6 mins",
        traffic="Clear",
        departments=[
            DepartmentInfo(
                name="Emergency Medicine",
                available_beds=5,
                doctors_on_duty=4,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Cardiology",
                available_beds=8,
                doctors_on_duty=3,
                emergency_support=True
            ),
            DepartmentInfo(
                name="General Medicine",
                available_beds=15,
                doctors_on_duty=5,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Neurology",
                available_beds=6,
                doctors_on_duty=2,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Orthopedics",
                available_beds=10,
                doctors_on_duty=3,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Pediatrics",
                available_beds=7,
                doctors_on_duty=2,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Dermatology",
                available_beds=4,
                doctors_on_duty=1,
                emergency_support=False
            )
        ]
    ),
    HospitalInfo(
        hospital_id="hosp-2",
        name="Max Super Speciality Hospital, Gurgaon",
        latitude=23.2750,
        longitude=77.4300,
        emergency_available=True,
        ambulance_available=True,
        address="Phase II, Sector 19, Gurugram",
        phone="+91 124 662 3000",
        total_beds=30,
        er_status="CARDIAC & TRAUMA ER",
        dist_str="4.2 km",
        time_str="12 mins",
        traffic="Moderate",
        departments=[
            DepartmentInfo(
                name="Emergency Medicine",
                available_beds=8,
                doctors_on_duty=3,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Cardiology",
                available_beds=4,
                doctors_on_duty=2,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Neurology",
                available_beds=3,
                doctors_on_duty=2,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Surgery",
                available_beds=6,
                doctors_on_duty=3,
                emergency_support=True
            )
        ]
    ),
    HospitalInfo(
        hospital_id="hosp-3",
        name="Fortis Healthcare Emergency, Vasant Kunj",
        latitude=23.2100,
        longitude=77.3800,
        emergency_available=True,
        ambulance_available=False,
        address="Sector B, Pocket 1, Vasant Kunj, New Delhi",
        phone="+91 11 4277 6222",
        total_beds=20,
        er_status="EMERGENCY BAY OPEN",
        dist_str="6.5 km",
        time_str="18 mins",
        traffic="Clear",
        departments=[
            DepartmentInfo(
                name="Emergency Medicine",
                available_beds=4,
                doctors_on_duty=2,
                emergency_support=True
            ),
            DepartmentInfo(
                name="General Medicine",
                available_beds=20,
                doctors_on_duty=4,
                emergency_support=False
            ),
            DepartmentInfo(
                name="Pediatrics",
                available_beds=12,
                doctors_on_duty=2,
                emergency_support=False
            ),
            DepartmentInfo(
                name="Primary Care",
                available_beds=25,
                doctors_on_duty=6,
                emergency_support=False
            )
        ]
    ),
    HospitalInfo(
        hospital_id="hosp-4",
        name="Apollo Hospital Emergency & Trauma, Sarita Vihar",
        latitude=23.3100,
        longitude=77.4800,
        emergency_available=True,
        ambulance_available=True,
        address="Mathura Road, Sarita Vihar, New Delhi",
        phone="+91 11 2692 5858",
        total_beds=40,
        er_status="NEURO & CARDIAC ER 24/7",
        dist_str="8.1 km",
        time_str="22 mins",
        traffic="Clear",
        departments=[
            DepartmentInfo(
                name="Emergency Medicine",
                available_beds=12,
                doctors_on_duty=5,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Cardiology",
                available_beds=8,
                doctors_on_duty=4,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Dermatology",
                available_beds=5,
                doctors_on_duty=2,
                emergency_support=False
            ),
            DepartmentInfo(
                name="ENT",
                available_beds=6,
                doctors_on_duty=2,
                emergency_support=False
            ),
            DepartmentInfo(
                name="Ophthalmology",
                available_beds=4,
                doctors_on_duty=2,
                emergency_support=False
            ),
            DepartmentInfo(
                name="Orthopedics",
                available_beds=8,
                doctors_on_duty=3,
                emergency_support=True
            )
        ]
    ),
    HospitalInfo(
        hospital_id="hosp-5",
        name="Medanta - The Medicity, Gurugram",
        latitude=23.2400,
        longitude=77.4500,
        emergency_available=True,
        ambulance_available=True,
        address="CH Baktawar Singh Road, Sector 38, Gurugram",
        phone="+91 124 414 1414",
        total_beds=50,
        er_status="MULTI-ORGAN TRAUMA CENTER",
        dist_str="11.4 km",
        time_str="28 mins",
        traffic="Moderate",
        departments=[
            DepartmentInfo(
                name="Emergency Medicine",
                available_beds=15,
                doctors_on_duty=6,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Gynecology",
                available_beds=14,
                doctors_on_duty=4,
                emergency_support=True
            ),
            DepartmentInfo(
                name="Pediatrics",
                available_beds=10,
                doctors_on_duty=3,
                emergency_support=True
            )
        ]
    )
]

