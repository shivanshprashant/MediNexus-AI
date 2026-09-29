
import requests
cases = [
    "The patient suddenly became unconscious and is not responding.",
    "My father is unconscious and not responding.",
    "I am having severe chest pain and difficulty breathing.",
    "My friend got shot in the head.",
    "I got shot in the leg.",
    "Someone swallowed poison.",
    "Someone was bitten by a snake.",
    "My eyes are mildly red and itchy.",
    "I have a mild headache since this morning and no other symptoms.",
    "I do not feel well.",
    "I am in love with a girl."
]

for case in cases:
    try:
        r = requests.post("http://localhost:8000/api/ai/symptom-analysis", json={"symptom_text": case, "medical_context": ""})
        data = r.json()
        print(f"INPUT: {case}")
        print(f"SEVERITY: {data.get('severity')}")
        print(f"EMERGENCY: {data.get('emergency')}")
        print(f"NEXT_STEP: {data.get('next_step')}")
        print(f"CONSULT_MODE: {data.get('consultation_mode')}")
        print("-" * 50)
    except Exception as e:
        print(f"FAILED {case}: {e}")

