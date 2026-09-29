import os
import logging
import httpx
from typing import Dict, Any

logger = logging.getLogger("medinexus.email")

async def send_email(to_email: str, subject: str, content: str) -> Dict[str, Any]:
    """
    Sends an email using the SendGrid v3 API.
    Gracefully falls back to mock logic if the API key is missing or invalid.
    """
    api_key = os.getenv("SENDGRID_API_KEY", "").strip()
    from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@medinexus.ai").strip()
    
    if not api_key or "placeholder" in api_key.lower():
        logger.warning(f"SendGrid API key not configured. Fallback mock email to {to_email}.")
        return {
            "status": "fallback",
            "message": f"Mock email sent to {to_email} with subject '{subject}'"
        }
        
    url = "https://api.sendgrid.com/v3/mail/send"
    
    payload = {
        "personalizations": [
            {
                "to": [{"email": to_email}],
                "subject": subject
            }
        ],
        "from": {"email": from_email},
        "content": [
            {
                "type": "text/html",
                "value": content
            }
        ]
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            
        if resp.status_code in (200, 202):
            logger.info(f"SendGrid email sent successfully to {to_email}.")
            return {"status": "success", "message": f"Email dispatched to {to_email}."}
        else:
            logger.error(f"SendGrid API Error ({resp.status_code}): {resp.text}")
            return {"status": "error", "message": "Failed to dispatch email via SendGrid."}
            
    except Exception as e:
        logger.error(f"Failed to connect to SendGrid API: {e}")
        return {"status": "error", "message": "Network error while sending email."}
