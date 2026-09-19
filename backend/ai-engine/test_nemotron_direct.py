import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from llm.nim_client import ask_nemotron
from llm.analyzer import SYSTEM_PROMPT

cases = [
    ("A", "I'm having severe chest pain."),
    ("B", "My father is unconscious."),
    ("C", "My pregnant wife is having immense pain."),
    ("D", "mild headache since this morning."),
    ("E", "I don't feel well."),
    ("F", "severe chest pain with sweating and difficulty breathing."),
    ("M1", "मेरे पिता बेहोश हैं।"),
    ("M2", "Mere father unconscious hain.")
]

print("=" * 70)
print("DIRECT NEMOTRON RAW OUTPUT TEST")
print("=" * 70)

for label, text in cases:
    prompt_input = f"""PATIENT CONTEXT
---------------
No additional patient context provided.

PATIENT-REPORTED INFORMATION
----------------------------
{text}
"""
    t0 = time.perf_counter()
    try:
        raw_resp, latency = ask_nemotron(SYSTEM_PROMPT, prompt_input, max_tokens=512)
        elapsed = time.perf_counter() - t0
        print(f"\n--- [{label}] INPUT: {text} ---")
        print(f"LATENCY: {latency:.2f}s (Total: {elapsed:.2f}s)")
        print("RAW RESPONSE:")
        print(raw_resp)
        try:
            # try to parse
            cleaned = raw_resp.strip()
            if cleaned.startswith("```"):
                lines = cleaned.splitlines()
                if lines[0].startswith("```"): lines = lines[1:]
                if lines and lines[-1].startswith("```"): lines = lines[:-1]
                cleaned = "\n".join(lines).strip()
            s = cleaned.find("{")
            e = cleaned.rfind("}")
            if s != -1 and e != -1:
                data = json.loads(cleaned[s:e+1])
                print("PARSED FIELDS:")
                print(f"  severity: {data.get('severity')}")
                print(f"  emergency: {data.get('emergency')}")
                print(f"  department: {data.get('department')}")
                print(f"  next_step: {data.get('next_step')}")
                print(f"  reason: {data.get('reason')}")
        except Exception as pe:
            print(f"PARSING ERROR: {pe}")
    except Exception as exc:
        print(f"\n--- [{label}] INPUT: {text} ---")
        print(f"NEMOTRON ERROR: {exc}")

