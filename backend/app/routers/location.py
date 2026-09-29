from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.location_service import calculate_route
from app.core.deps import get_current_user

router = APIRouter(prefix="/location", tags=["Location & Routing"])

class RouteRequest(BaseModel):
    origin: str
    destination: str

@router.post("/route")
async def get_route(req: RouteRequest, user: dict = Depends(get_current_user)):
    """
    Returns estimated routing and ETA.
    """
    return await calculate_route(req.origin, req.destination)
