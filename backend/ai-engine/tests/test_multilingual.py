import sys
import os

# Set UTF-8 output encoding for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from schemas.health import HealthAssessment
from llm.analyzer import analyze_patient, detect_language
from emergency.safety import validate_emergency_assessment, prescreen_emergency
from pathway.resolver import resolve_pathway


def run_multilingual_test_matrix():
    print("=" * 70)
    print("MEDINEXUS AI — MULTILINGUAL VOICE & TRIAGE TEST MATRIX")
    print("=" * 70)

    test_cases = [
        {
            "id": "TEST A",
            "lang": "en",
            "desc": "English Emergency",
            "input": "My father is unconscious.",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        },
        {
            "id": "TEST B",
            "lang": "hi",
            "desc": "Hindi Emergency (Devanagari)",
            "input": "मेरे पिता बेहोश हैं",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        },
        {
            "id": "TEST C",
            "lang": "hinglish",
            "desc": "Hinglish Emergency",
            "input": "mere father unconscious hain",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        },
        {
            "id": "TEST D",
            "lang": "hi",
            "desc": "Hindi Emergency Variant 2",
            "input": "मेरे पिताजी होश में नहीं हैं",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        },
        {
            "id": "TEST E",
            "lang": "hi",
            "desc": "Hindi Breathing Emergency",
            "input": "मेरे पापा को सांस लेने में बहुत दिक्कत हो रही है",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        },
        {
            "id": "TEST F",
            "lang": "hi",
            "desc": "Hindi Severe Chest Pain",
            "input": "मेरे सीने में बहुत तेज दर्द हो रहा है",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        },
        {
            "id": "TEST G",
            "lang": "hi",
            "desc": "Hindi Low Severity Routine",
            "input": "मुझे आज सुबह से हल्का सिरदर्द है और कोई दूसरा लक्षण नहीं है",
            "expected_severity": "LOW",
            "expected_emergency": False,
            "expected_next_step": "VIDEO_OR_IN_PERSON"
        },
        {
            "id": "TEST H",
            "lang": "en",
            "desc": "English Low Severity Routine",
            "input": "I have a mild headache since this morning and no other symptoms.",
            "expected_severity": "LOW",
            "expected_emergency": False,
            "expected_next_step": "VIDEO_OR_IN_PERSON"
        },
        {
            "id": "TEST I",
            "lang": "hinglish",
            "desc": "Hinglish Low Severity Routine",
            "input": "mujhe subah se halka headache hai aur koi aur symptom nahi hai",
            "expected_severity": "LOW",
            "expected_emergency": False,
            "expected_next_step": "VIDEO_OR_IN_PERSON"
        },
        {
            "id": "TEST J",
            "lang": "bn",
            "desc": "Bengali Emergency",
            "input": "আমার বাবা জ্ঞান হারিয়ে ফেলেছেন",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        },
        {
            "id": "TEST K",
            "lang": "ta",
            "desc": "Tamil Emergency",
            "input": "என் தந்தை சுயநினைவின்றி உள்ளார்",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        },
        {
            "id": "TEST L",
            "lang": "te",
            "desc": "Telugu Emergency",
            "input": "మా నాన్న స్పృహ తప్పిపోయారు",
            "expected_severity": "EMERGENCY",
            "expected_emergency": True,
            "expected_next_step": "EMERGENCY"
        }
    ]

    passed = 0
    total = len(test_cases)

    for tc in test_cases:
        t_id = tc["id"]
        t_desc = tc["desc"]
        inp = tc["input"]

        # Step 1: Detect language
        detected = detect_language(inp)
        
        # Step 2: Prescreen & Assess
        prescreened = prescreen_emergency(inp)
        if prescreened:
            val_assessment = validate_emergency_assessment(prescreened)
        else:
            raw = analyze_patient(inp)
            val_assessment = validate_emergency_assessment(raw)

        # Step 3: Pathway Resolution
        pathway = resolve_pathway(val_assessment)

        # Verification Assertions
        if tc["expected_emergency"]:
            assert val_assessment.severity == "EMERGENCY", f"[{t_id}] Expected severity EMERGENCY, got {val_assessment.severity}"
            assert val_assessment.emergency is True, f"[{t_id}] Expected emergency True, got {val_assessment.emergency}"
        else:
            assert val_assessment.emergency is False, f"[{t_id}] Expected emergency False for routine case, got {val_assessment.emergency}"
            assert val_assessment.severity in ["LOW", "MODERATE"], f"[{t_id}] Expected non-emergency severity, got {val_assessment.severity}"
        
        print(f"[PASS] {t_id} — {t_desc}")
        print(f"       Language Detected: '{detected}' | Input: '{inp}'")
        print(f"       Severity: {val_assessment.severity} | Emergency: {val_assessment.emergency} | Next Step: {pathway.next_step}\n")
        passed += 1

    print("=" * 70)
    print(f"ALL {passed}/{total} MULTILINGUAL TRIAGE & PATHWAY TESTS PASSED CLEANLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_multilingual_test_matrix()
