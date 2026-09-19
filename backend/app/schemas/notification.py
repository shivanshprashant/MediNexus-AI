from pydantic import BaseModel
from typing import Optional

class NotificationItemSchema(BaseModel):
    id: str
    title: str
    desc: Optional[str] = None
    time: Optional[str] = None
    type: str
    category: Optional[str] = None
    unread: bool = True
    summary: Optional[str] = None
    content: Optional[str] = None
