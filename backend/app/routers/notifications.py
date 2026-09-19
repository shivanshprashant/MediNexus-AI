import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
import asyncpg
from app.core.database import get_db_pool
from app.schemas.notification import NotificationItemSchema
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

DEMO_NOTIFICATIONS: List[NotificationItemSchema] = [
    NotificationItemSchema(
        id="notif-001",
        title="🚨 New Emergency Request P-102",
        desc="Hospital emergency request P-102 requires immediate attention. Chest pain & acute distress.",
        time="2 min ago",
        type="EMERGENCY",
        unread=True,
        category="urgent",
        summary="Emergency intake required for chest pain",
        content="Patient P-102 (58M) presented with acute chest discomfort."
    ),
    NotificationItemSchema(
        id="notif-002",
        title="Doctor Duty Update",
        desc="Dr. Sharma is now ON DUTY in Emergency Medicine department.",
        time="8 min ago",
        type="STAFF",
        unread=True,
        category="alert-log",
        summary="Dr. Sharma checked ON DUTY",
        content="Shift: Morning (08:00 - 16:00)"
    ),
    NotificationItemSchema(
        id="notif-003",
        title="Emergency Request P-204 Accepted",
        desc="Request P-204 accepted. CCU Bed #04 assigned to Cardiology intake.",
        time="12 min ago",
        type="SYSTEM",
        unread=False,
        category="appointment",
        summary="Bed #04 assigned",
        content="Intake completed for patient P-204"
    )
]

@router.get("", response_model=List[NotificationItemSchema])
async def list_notifications(
    user_id: Optional[str] = Query(None),
    hospital_id: Optional[str] = Query(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        return DEMO_NOTIFICATIONS

    async with pool.acquire() as conn:
        query = "SELECT * FROM notifications WHERE 1=1"
        args = []
        if user_id:
            args.append(user_id)
            query += f" AND user_id = ${len(args)}"
        if hospital_id:
            args.append(hospital_id)
            query += f" AND hospital_id = ${len(args)}"
            
        query += " ORDER BY created_at DESC"
        rows = await conn.fetch(query, *args)
        if not rows:
            return DEMO_NOTIFICATIONS

        return [
            NotificationItemSchema(
                id=r["id"],
                title=r["title"],
                desc=r["desc_text"] or "",
                time=r["time_text"] or "Recently",
                type=r["type"],
                category=r["category"],
                unread=r["unread"] if r["unread"] is not None else True,
                summary=r["summary"],
                content=r["content"]
            )
            for r in rows
        ]

@router.put("/{notification_id}/read", response_model=NotificationItemSchema)
async def mark_notification_read(
    notification_id: str,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    if not pool:
        for n in DEMO_NOTIFICATIONS:
            if n.id == notification_id:
                n.unread = False
                return n
        DEMO_NOTIFICATIONS[0].unread = False
        return DEMO_NOTIFICATIONS[0]

    async with pool.acquire() as conn:
        await conn.execute("UPDATE notifications SET unread = FALSE WHERE id = $1", notification_id)
        r = await conn.fetchrow("SELECT * FROM notifications WHERE id = $1", notification_id)
        if not r:
            raise HTTPException(status_code=404, detail="Notification not found.")
        return NotificationItemSchema(
            id=r["id"],
            title=r["title"],
            desc=r["desc_text"] or "",
            time=r["time_text"] or "Recently",
            type=r["type"],
            category=r["category"],
            unread=False,
            summary=r["summary"],
            content=r["content"]
        )

@router.get("/stream")
async def sse_notifications_stream(
    request: Request,
    hospital_id: Optional[str] = Query("hsp-001")
):
    """Realtime notifications event stream."""
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            await asyncio.sleep(15)
            yield {"event": "ping", "data": "keep-alive"}

    return EventSourceResponse(event_generator())
