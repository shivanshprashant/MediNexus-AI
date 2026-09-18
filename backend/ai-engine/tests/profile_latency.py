import sys
import os
import time
import json
import statistics
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

API_URL = "http://127.0.0.1:8080/api/assess"

TEXT_SUITE = [
    {
        "id": "TEXT-1",
        "name": "Mild Headache (Routine)",
        "input": "I have a mild headache since this morning."
    },
    {
        "id": "TEXT-2",
        "name": "Unconscious Father (Emergency Interceptor)",
        "input": "My father is unconscious."
    },
    {
        "id": "TEXT-3",
        "name": "Severe Chest Pain & Breathing (Emergency Critical)",
        "input": "I have severe chest pain and difficulty breathing."
    }
]

VOICE_SUITE = [
    {
        "id": "VOICE-EN",
        "lang": "English",
        "input": "I have severe chest discomfort and heavy breathing."
    },
    {
        "id": "VOICE-HI",
        "lang": "Hindi",
        "input": "मेरे सीने में बहुत तेज दर्द हो रहा है"
    },
    {
        "id": "VOICE-HINGLISH",
        "lang": "Hinglish",
        "input": "mere chest mein severe pain ho raha hai"
    }
]


def send_post_request(url, payload_dict):
    data_bytes = json.dumps(payload_dict).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode('utf-8')
        return resp.status, json.loads(body)


def profile_suite(suite_name, test_cases, runs_per_case=3):
    print("\n" + "=" * 75)
    print(f"LATENCY PROFILING RUN — {suite_name} ({runs_per_case} RUNS EACH)")
    print("=" * 75)

    suite_results = {}

    for item in test_cases:
        item_id = item["id"]
        label = item.get("name") or item.get("lang") or item_id
        inp = item["input"]
        print(f"\n▶ Testing {item_id}: '{label}'")
        print(f"  Input: \"{inp}\"")

        times = []
        for run in range(1, runs_per_case + 1):
            t0 = time.perf_counter()
            try:
                status_code, data = send_post_request(API_URL, {"symptomText": inp})
                t1 = time.perf_counter()
                elapsed = t1 - t0
                times.append(elapsed)
                severity = data.get("assessment", {}).get("severity", "N/A")
                print(f"  Run {run}: {elapsed:.3f} sec (Status: {status_code}, Severity: {severity})")
            except Exception as exc:
                t1 = time.perf_counter()
                elapsed = t1 - t0
                times.append(elapsed)
                print(f"  Run {run}: FAILED after {elapsed:.3f} sec ({exc})")

        min_t = min(times)
        max_t = max(times)
        avg_t = statistics.mean(times)
        suite_results[item_id] = {
            "name": label,
            "min": min_t,
            "max": max_t,
            "avg": avg_t,
            "times": times
        }
        print(f"  ➜ Stats: Fastest = {min_t:.3f}s | Slowest = {max_t:.3f}s | Average = {avg_t:.3f}s")

    return suite_results


def print_summary_table(results_dict):
    print("\n" + "=" * 75)
    print(f"{'TEST CASE':<40} | {'FASTEST':<10} | {'SLOWEST':<10} | {'AVERAGE':<10}")
    print("=" * 75)
    for test_id, res in results_dict.items():
        name = res["name"]
        print(f"{name:<40} | {res['min']:.3f}s     | {res['max']:.3f}s     | {res['avg']:.3f}s")
    print("=" * 75)


if __name__ == "__main__":
    print("Starting MediNexus AI Latency Profiler...")
    text_results = profile_suite("TEXT INPUT SUITE", TEXT_SUITE, runs_per_case=3)
    print_summary_table(text_results)

    voice_results = profile_suite("VOICE INPUT SUITE", VOICE_SUITE, runs_per_case=3)
    print_summary_table(voice_results)
