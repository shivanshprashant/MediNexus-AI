import urllib.request
import json
import time

cases = [
    "I'm having severe chest pain.",
    "My father is unconscious.",
    "My pregnant wife is having immense/severe pain.",
    "My pregnant wife is having immense pain.",
    "mild headache since this morning.",
    "I don't feel well.",
    "severe chest pain with sweating and difficulty breathing.",
    "मेरे पिता बेहोश हैं।",
    "Mere father unconscious hain."
]

print("=" * 60)
print("TESTING FASTAPI /api/assess FOR ALL CASES")
print("=" * 60)

for text in cases:
    t0 = time.perf_counter()
    payload = {
        "symptomText": text,
        "patient_latitude": 23.2599,
        "patient_longitude": 77.4126
    }
    json_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/assess",
        data=json_bytes,
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=35) as res:
            elapsed = time.perf_counter() - t0
            data = json.loads(res.read().decode())
            assessment = data.get("assessment", {})
            pathway = data.get("pathway", {})
            print(f"\nINPUT: {text}")
            print(f"ELAPSED: {elapsed:.2f}s")
            print(f"SEVERITY: {assessment.get('severity')}")
            print(f"EMERGENCY: {assessment.get('emergency')}")
            print(f"DEPARTMENT: {assessment.get('department')}")
            print(f"NEXT_STEP: {assessment.get('next_step')}")
            print(f"REASON: {assessment.get('reason')}")
            print(f"PATHWAY: {pathway.get('recommendation_title')}")
    except Exception as e:
        print(f"\nINPUT: {text}")
        print(f"FAILED: {e}")

