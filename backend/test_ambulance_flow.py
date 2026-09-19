import urllib.request
import json

def test_api():
    req_body = {
        "mode": "ambulance",
        "target_hospital_id": "hsp-001",
        "complaint": "Acute chest pain with severe dyspnea",
        "patient_name": "Ananya Sharma",
        "age_gender": "29 / Female",
        "medical_info": "Allergies: Penicillin | Blood: O+"
    }
    data = json.dumps(req_body).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/emergency/sos",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        print("SOS Trigger Response:")
        print(f"ID: {res.get('id')}")
        print(f"Patient: {res.get('patientName')}")
        print(f"Ambulance: {res.get('ambulanceNumber')}")
        print(f"Driver Name: {res.get('driverName')}")
        print(f"Driver Phone: {res.get('driverPhone')}")
        print(f"Mode: {res.get('mode')}")

    # Test admin login and list ambulances
    login_body = {
        "hospital_code": "HSP-001",
        "email": "admin@citycare.org",
        "password": "secret"
    }
    req_login = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login/hospital-admin",
        data=json.dumps(login_body).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_login) as resp:
        login_res = json.loads(resp.read().decode())
        token = login_res["access_token"]
        print(f"\nAdmin Login OK: role={login_res['role']}, hospital_id={login_res.get('hospital_id')}")

    # List ambulances
    req_amb = urllib.request.Request(
        "http://127.0.0.1:8000/api/admin/ambulances",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_amb) as resp:
        ambs = json.loads(resp.read().decode())
        print(f"Ambulance Fleet Count for HSP-001: {len(ambs)}")
        for a in ambs:
            print(f" - [{a['status']}] {a['ambulance_number']} ({a['ambulance_type']}) | Driver: {a['driver_name']} ({a['driver_phone']})")

if __name__ == '__main__':
    test_api()
