import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("medinexus.telephony")

async def initiate_driver_call(to_number: str = None, patient_name: str = "Patient") -> dict:
    """
    Initiates a real outbound voice call via Twilio REST API to the configured demo driver recipient.
    Raises ValueError if telephony provider is unconfigured or credentials are missing.
    """
    account_sid = (settings.TELEPHONY_ACCOUNT_ID or "").strip()
    auth_token = (settings.TELEPHONY_AUTH_TOKEN or "").strip()
    from_number = (settings.TELEPHONY_FROM_NUMBER or "").strip()
    dest_number = (to_number or settings.DEMO_DRIVER_CONTACT or "").strip()

    # Validate provider configuration
    if not account_sid or not auth_token or not from_number or not dest_number:
        raise ValueError(
            "Telephony provider is not configured. Please set TELEPHONY_ACCOUNT_ID, "
            "TELEPHONY_AUTH_TOKEN, TELEPHONY_FROM_NUMBER, and DEMO_DRIVER_CONTACT in backend/.env"
        )

    if "placeholder" in account_sid.lower() or "placeholder" in auth_token.lower():
        raise ValueError(
            "Telephony provider credentials contain placeholder values. Please set valid "
            "TELEPHONY_ACCOUNT_ID and TELEPHONY_AUTH_TOKEN in backend/.env"
        )

    # Format destination phone number to E.164 if missing leading +
    if not dest_number.startswith("+"):
        if len(dest_number) == 10 and dest_number.isdigit():
            dest_number = f"+91{dest_number}"
        else:
            dest_number = f"+{dest_number}"

    if not from_number.startswith("+"):
        if len(from_number) == 10 and from_number.isdigit():
            from_number = f"+91{from_number}"
        else:
            from_number = f"+{from_number}"

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json"
    twiml_body = (
        f"<Response><Say voice='alice'>Critical Emergency SOS alert from MediNexus AI for {patient_name}. "
        f"Connecting ambulance driver dispatch session.</Say></Response>"
    )

    payload = {
        "To": dest_number,
        "From": from_number,
        "Twiml": twiml_body,
    }

    logger.info(f"Initiating Twilio outbound call to {dest_number} from {from_number}")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                data=payload,
                auth=(account_sid, auth_token),
            )
    except Exception as e:
        logger.error(f"Telephony HTTP request failed: {e}")
        raise RuntimeError(f"Failed to connect to telephony provider network: {e}")

    if response.status_code not in (200, 201):
        err_detail = response.text
        try:
            err_json = response.json()
            err_detail = err_json.get("message", err_detail)
        except Exception:
            pass
        error_msg = f"Telephony provider error ({response.status_code}): {err_detail}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    data = response.json()
    call_sid = data.get("sid", "unknown")
    logger.info(f"Twilio call initiated successfully. SID: {call_sid}")

    return {
        "status": "success",
        "message": f"Outbound call initiated to driver ({dest_number}).",
        "call_sid": call_sid,
        "to": dest_number,
        "from": from_number,
    }
