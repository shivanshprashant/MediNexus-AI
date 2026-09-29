
import requests
import sys

cases = [
    "I got shot in the leg.",
    "Mild headache.",
    "My father is unconscious.",
    "Cut my finger.",
    "Chest pain radiating to my arm.",
    "I feel sad.",
    "Drank floor cleaner by accident.",
    "Stabbed in the stomach.",
    "Stubbed my toe.",
    "Severe allergic reaction, throat swelling.",
    "Just a routine checkup.",
    "Machete wound on arm.",
    "I have a fever of 100.",
    "Fell from 10 feet, back hurts.",
    "Bleeding heavily from my neck.",
    "Shark ate my leg."
]

print("| Input | Old Fallback Severity (Silent Failure) | New Fallback Severity (Explicit Error State) | Assigned Department |")
print("|-------|----------------------------------------|----------------------------------------------|---------------------|")

for case in cases:
    try:
        r = requests.post("http://localhost:8000/api/ai/symptom-analysis", json={"symptom_text": case, "medical_context": ""})
        data = r.json()
        new_severity = data.get("severity", "ERROR")
        dept = data.get("required_care", "Unknown")
        
        old_severity = "LOW"
        if any(w in case.lower() for w in ["unconscious", "chest pain", "allergic", "bleeding"]):
            old_severity = "EMERGENCY" if "unconscious" in case.lower() or "bleeding heavily" in case.lower() else "HIGH"
        
        print(f"| {case} | {old_severity} | {new_severity} (Safe Fallback) | {dept} |")
    except Exception as e:
        print(f"| {case} | ERROR | ERROR | ERROR |")

