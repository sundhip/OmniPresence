from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from app.models.database import get_db
from app.models.outfit import Outfit, CalendarEvent
from app.schemas.outfit import OutfitCreate, OutfitUpdate, OutfitResponse, CalendarEventCreate, CalendarEventResponse
from app.core.security import get_current_user_id

router = APIRouter()

@router.get("", response_model=List[OutfitResponse])
async def list_outfits(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Outfit).where(Outfit.user_id == user_id).order_by(Outfit.created_at.desc()))
    return result.scalars().all()

@router.post("", response_model=OutfitResponse)
async def create_outfit(data: OutfitCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    outfit = Outfit(
        id=str(uuid.uuid4()),
        user_id=user_id,
        **data.model_dump()
    )
    db.add(outfit)
    await db.commit()
    await db.refresh(outfit)
    return outfit

@router.get("/calendar/events", response_model=List[CalendarEventResponse])
async def list_calendar_events(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.user_id == user_id).order_by(CalendarEvent.start_time.asc()))
    return result.scalars().all()

@router.post("/calendar/events", response_model=CalendarEventResponse)
async def create_calendar_event(data: CalendarEventCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    event = CalendarEvent(
        id=str(uuid.uuid4()),
        user_id=user_id,
        **data.model_dump()
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event
