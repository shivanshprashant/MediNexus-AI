import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

test_scenarios = [
    {
        "id": "SCENARIO-1",
        "input": "My father is unconscious.",
        "expected_min_severity": "EMERGENCY",
        "expected_emergency": True,
        "must_not_be": ["LOW", "MODERATE", "HIGH"],
    },
    {
        "id": "SCENARIO-2",
        "input": "Mere father unconscious hain.",
        "expected_min_severity": "EMERGENCY",
        "expected_emergency": True,
        "must_not_be": ["LOW", "MODERATE", "HIGH"],
    },
    {
        "id": "SCENARIO-3",
        "input": "मेरे पिता बेहोश हैं।",
        "expected_min_severity": "EMERGENCY",
        "expected_emergency": True,
        "must_not_be": ["LOW", "MODERATE", "HIGH"],
    },
    {
        "id": "SCENARIO-4",
        "input": "I'm having severe chest pain.",
        "expected_min_severity": "EMERGENCY",
        "expected_emergency": True,
        "must_not_be": ["LOW", "MODERATE"],
    },
    {
        "id": "SCENARIO-5",
        "input": "severe chest pain with sweating and difficulty breathing.",
        "expected_min_severity": "EMERGENCY",
        "expected_emergency": True,
        "must_not_be": ["LOW", "MODERATE", "HIGH"],
    },
    {
        "id": "SCENARIO-6",
        "input": "My pregnant wife is having immense/severe pain.",
        "expected_min_severity": "HIGH",
        "expected_emergency": None, # can be False (HIGH) or True (EMERGENCY)
        "must_not_be": ["LOW"],
    },
    {
        "id": "SCENARIO-7",
        "input": "mild headache since this morning.",
        "expected_min_severity": "LOW",
        "expected_emergency": False,
        "must_not_be": ["EMERGENCY"],
    },
    {
        "id": "SCENARIO-8",
        "input": "I don't feel well.",
        "expected_min_severity": "LOW", # or MODERATE
        "expected_emergency": False,
        "must_not_be": ["EMERGENCY"],
    }
]

print("=" * 80)
print("MEDINEXUS AI — END-TO-END ACCEPTANCE SUITE")
print("=" * 80)

all_passed = True
results_summary = []

for item in test_scenarios:
    scen_id = item["id"]
    text = item["input"]
    client_req_id = f"TEST-{scen_id}-{int(time.time())%1000}"

    payload = {
        "symptomText": text,
        "patient_latitude": 23.2599,
        "patient_longitude": 77.4126,
        "request_id": client_req_id
    }
    json_bytes = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/assess",
        data=json_bytes,
        headers={'Content-Type': 'application/json; charset=utf-8'}
    )

    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=50) as res:
            elapsed = time.perf_counter() - t0
            raw_bytes = res.read()
            data = json.loads(raw_bytes.decode('utf-8'))
            assessment = data.get("assessment", {})
            pathway = data.get("pathway", {})
            sev = assessment.get("severity")
            emerg = assessment.get("emergency")
            dept = assessment.get("department")
            next_step = assessment.get("next_step")
            reason = assessment.get("reason")
            resp_req_id = data.get("request_id")

            # Check criteria
            failed_reasons = []
            if sev in item["must_not_be"]:
                failed_reasons.append(f"Severity '{sev}' is in prohibited list {item['must_not_be']}")
            if item["expected_emergency"] is not None and emerg != item["expected_emergency"]:
                failed_reasons.append(f"Expected emergency={item['expected_emergency']}, got {emerg}")

            status = "PASS" if not failed_reasons else "FAIL"
            if status == "FAIL":
                all_passed = False

            print(f"\n[{scen_id}] {status} | Elapsed: {elapsed:.2f}s | ReqId: {resp_req_id}")
            print(f"  Input:       {text}")
            print(f"  Severity:    {sev}")
            print(f"  Emergency:   {emerg}")
            print(f"  Department:  {dept}")
            print(f"  Next Step:   {next_step}")
            print(f"  Pathway:     {pathway.get('recommendation_title')}")
            print(f"  Reason:      {reason}")
            if failed_reasons:
                print(f"  ERRORS:      {failed_reasons}")

            results_summary.append({
                "id": scen_id,
                "input": text,
                "severity": sev,
                "emergency": emerg,
                "department": dept,
                "elapsed": f"{elapsed:.2f}s",
                "status": status
            })

    except Exception as exc:
        all_passed = False
        print(f"\n[{scen_id}] FAIL (Exception) | Input: {text}")
        print(f"  Error: {exc}")
        results_summary.append({
            "id": scen_id,
            "input": text,
            "severity": "ERROR",
            "emergency": False,
            "department": "ERROR",
            "elapsed": "N/A",
            "status": "FAIL"
        })

print("\n" + "=" * 80)
print("FINAL ACCEPTANCE SUMMARY:")
print("=" * 80)
for r in results_summary:
    print(f"{r['id']:12} | {r['status']:4} | Sev: {r['severity']:10} | Emerg: {str(r['emergency']):5} | Dept: {r['department']:20} | Time: {r['elapsed']} | {r['input'][:35]}")

if all_passed:
    print("\n>>> ALL ACCEPTANCE TESTS PASSED CLEANLY! <<<")
else:
    print("\n>>> SOME ACCEPTANCE TESTS FAILED! <<<")
    sys.exit(1)
