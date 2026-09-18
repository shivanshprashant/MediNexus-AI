import urllib.request
import json
import time

def test_api_endpoints():
    print("Testing FastAPI Endpoints...")

    # Give server 1 sec to bind
    time.sleep(1)

    # 1. Health check
    req = urllib.request.Request("http://127.0.0.1:8080/api/health")

    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        assert data["status"] == "healthy"
        print("[PASS] GET /api/health returned healthy status")

    # 2. List hospitals
    req = urllib.request.Request("http://127.0.0.1:8080/api/hospitals")
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        assert data["count"] > 0
        h0 = data["hospitals"][0]
        assert "vacantBeds" in h0
        assert "dist" in h0
        print(f"[PASS] GET /api/hospitals returned {data['count']} registered hospitals with frontend format")

    # 3. Assess Patient (Emergency scenario with symptomText key)
    payload = {
        "symptomText": "Sudden severe chest pain, shortness of breath, radiating pain to left arm",
        "patient_context": {
            "age": 62,
            "gender": "Male",
            "medical_conditions": ["Hypertension"],
            "medications": ["Lisinopril"],
            "allergies": [],
            "previous_major_conditions": ["Angina"]
        },
        "patient_latitude": 23.2599,
        "patient_longitude": 77.4126
    }
    json_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/assess",
        data=json_bytes,
        headers={'Content-Type': 'application/json'}
    )

    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        assessment = data["assessment"]
        print(f"[PASS] POST /api/assess Emergency result:")
        print(f"       Severity: {assessment['severity']}")
        print(f"       Emergency: {assessment['emergency']}")
        print(f"       Level: {assessment.get('level')}")
        print(f"       Department: {assessment['department']}")
        print(f"       Action: {assessment['recommended_action']}")
        print(f"       Hospitals count: {data['total_eligible']}")
        assert assessment["emergency"] is True
        assert assessment["severity"] == "EMERGENCY"
        assert len(data["hospitals"]) > 0

    # 4. Emergency Pre-screening Endpoint
    prescreen_payload = {"symptomText": "patient is unconscious"}
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/emergency/prescreen",
        data=json.dumps(prescreen_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        assert data["is_emergency"] is True
        print("[PASS] POST /api/emergency/prescreen detected emergency trigger")

    # 5. Doctor Summary Endpoint
    doc_payload = {"name": "Ananya Sharma", "mrn": "MN-PT-4091", "reason": "Chest tightness"}
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/doctor/summary",
        data=json.dumps(doc_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        assert "summary" in data
        print("[PASS] POST /api/doctor/summary generated doctor AI summary")

    # 6. Voice STT Endpoint
    voice_payload = {"sample_text": "Mujhe seene mein dard ho raha hai."}
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/voice/transcribe",
        data=json.dumps(voice_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        assert "transcribed_text" in data
        print("[PASS] POST /api/voice/transcribe STT endpoint operational")

    print("\nFASTAPI API INTEGRATION TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_api_endpoints()

