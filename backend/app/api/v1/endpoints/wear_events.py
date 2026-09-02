from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime
import uuid
from app.models.database import get_db
from app.models.wear_event import WearEvent
from app.models.wardrobe import WardrobeItem
from app.schemas.wear_event import WearEventCreate, WearEventResponse, ItemWearStats
from app.core.security import get_current_user_id

router = APIRouter()

@router.post("", response_model=WearEventResponse)
async def record_wear_event(data: WearEventCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    # Verify wardrobe item exists
    item_res = await db.execute(select(WardrobeItem).where(WardrobeItem.id == data.wardrobe_item_id, WardrobeItem.owner_id == user_id))
    item = item_res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Wardrobe item not found")
    
    now = data.timestamp or datetime.utcnow()
    event = WearEvent(
        id=str(uuid.uuid4()),
        user_id=user_id,
        wardrobe_item_id=data.wardrobe_item_id,
        outfit_id=data.outfit_id,
        timestamp=now,
        event_context=data.event_context,
        source=data.source
    )
    
    # Increment wear count on the item
    item.wear_count += 1
    item.last_worn_date = now
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event

@router.get("/item/{item_id}", response_model=List[WearEventResponse])
async def get_item_wear_history(item_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WearEvent)
        .where(WearEvent.wardrobe_item_id == item_id, WearEvent.user_id == user_id)
        .order_by(WearEvent.timestamp.desc())
    )
    return result.scalars().all()

@router.get("/stats/{item_id}", response_model=ItemWearStats)
async def get_item_stats(item_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    item_res = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id, WardrobeItem.owner_id == user_id))
    item = item_res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    cost_per_wear = round(item.purchase_price / max(item.wear_count, 1), 2)
    days_since = (datetime.utcnow() - item.last_worn_date).days if item.last_worn_date else None
    
    return ItemWearStats(
        item_id=item.id,
        item_name=item.name,
        wear_count=item.wear_count,
        last_worn_date=item.last_worn_date,
        cost_per_wear=cost_per_wear,
        days_since_last_worn=days_since
    )
