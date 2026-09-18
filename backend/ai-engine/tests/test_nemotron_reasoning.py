import os
import sys
import time
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY,
    timeout=20.0,
)

MODEL_NAME = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"

PROMPT = """You are MediNexus AI triage. Output ONLY valid JSON with keys: severity, emergency, department, next_step, consultation_mode, recommended_action, reason, immediate_guidance."""

USER_MSG = "I have a mild headache since this morning and no other symptoms."

def test_config(name, extra_kwargs):
    print(f"\n--- Testing {name} ---")
    t0 = time.perf_counter()
    try:
        resp = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": PROMPT},
                {"role": "user", "content": USER_MSG}
            ],
            **extra_kwargs
        )
        t1 = time.perf_counter()
        dur = t1 - t0
        content = resp.choices[0].message.content if resp and resp.choices else ""
        print(f"Latency: {dur:.2f} sec")
        print(f"Content Length: {len(content)} chars")
        print(f"Snippet: {repr(content[:200])}")
        return dur, content
    except Exception as exc:
        t1 = time.perf_counter()
        print(f"FAILED after {t1-t0:.2f} sec: {exc}")
        return t1-t0, None

if __name__ == "__main__":
    print("Testing Nemotron API Configurations...")
    
    # Test 1: Baseline (temperature=0.2, max_tokens=1024)
    test_config("Config 1: Baseline max_tokens=1024", {"temperature": 0.2, "max_tokens": 1024})

    # Test 2: max_tokens=384
    test_config("Config 2: max_tokens=384", {"temperature": 0.2, "max_tokens": 384})

    # Test 3: max_tokens=512, top_p=0.9
    test_config("Config 3: max_tokens=512, top_p=0.9", {"temperature": 0.1, "max_tokens": 512, "top_p": 0.9})
