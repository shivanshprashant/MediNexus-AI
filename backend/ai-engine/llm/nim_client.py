import os
import time
import logging
from dotenv import load_dotenv
from openai import OpenAI, APIStatusError, APIConnectionError, RateLimitError

# Load variables from .env
load_dotenv()

# Get NVIDIA API key
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

if not NVIDIA_API_KEY:
    raise ValueError(
        "NVIDIA_API_KEY is not set. Please check your .env file."
    )

# Create NVIDIA API client
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY,
    timeout=45.0,
)

# MediNexus AI model
MODEL_NAME = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"

logger = logging.getLogger("medinexus.nim_client")


class NemotronAPIError(Exception):
    """Custom exception raised when calls to NVIDIA Nemotron fail after retries."""
    pass


def ask_nemotron(
    system_prompt: str,
    user_message: str,
    max_retries: int = 3,
    initial_backoff_sec: float = 1.0,
    max_backoff_sec: float = 8.0,
    max_tokens: int = 1024,
    temperature: float = 0.2,
    request_id: str | None = None
) -> tuple[str, float]:
    """
    Send a message to NVIDIA Nemotron with bounded exponential backoff retry.
    Returns (content_string, latency_seconds).
    """
    backoff = initial_backoff_sec

    for attempt in range(1, max_retries + 1):
        t0 = time.perf_counter()
        try:
            if request_id:
                print(f"[{request_id}] NVIDIA_REQUEST_STARTED", flush=True)

            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_message,
                    },
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            t1 = time.perf_counter()
            nemotron_latency = t1 - t0

            if response and response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                if content:
                    print(f"[PERF] Nemotron: {nemotron_latency:.2f} sec", flush=True)
                    if request_id:
                        print(f"[{request_id}] NVIDIA_RAW_RESPONSE:\n{content.strip()}", flush=True)
                    return content.strip(), nemotron_latency
            
            raise NemotronAPIError("Empty or invalid response from NVIDIA Nemotron API.")

        except (RateLimitError, APIConnectionError) as exc:
            logger.warning(f"Transient error on Nemotron attempt {attempt}/{max_retries}: {exc}")
            if attempt == max_retries:
                raise NemotronAPIError(
                    f"NVIDIA Nemotron service temporarily unavailable after {max_retries} attempts: {exc}"
                ) from exc

        except APIStatusError as exc:
            status_code = getattr(exc, "status_code", None)
            # Retry on 503 Service Unavailable, 429 Rate Limit, or 500/502/504 Gateway errors
            if status_code in (429, 500, 502, 503, 504):
                logger.warning(f"NVIDIA API status {status_code} on attempt {attempt}/{max_retries}: {exc}")
                if attempt == max_retries:
                    raise NemotronAPIError(
                        f"NVIDIA Nemotron API returned status {status_code} after {max_retries} retries."
                    ) from exc
            else:
                # Non-retryable API error (e.g. 401 Unauthorized, 400 Bad Request)
                raise NemotronAPIError(
                    f"NVIDIA Nemotron API error (status {status_code}): {exc.message}"
                ) from exc

        except Exception as exc:
            logger.error(f"Unexpected error calling Nemotron API: {exc}")
            if attempt == max_retries:
                raise NemotronAPIError(
                    f"Failed to communicate with NVIDIA Nemotron API: {exc}"
                ) from exc

        time.sleep(backoff)
        backoff = min(backoff * 2.0, max_backoff_sec)

    raise NemotronAPIError(f"Failed to obtain response from NVIDIA Nemotron API after {max_retries} retries.")