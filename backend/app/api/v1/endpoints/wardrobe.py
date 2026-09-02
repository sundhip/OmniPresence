from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
import uuid
from app.models.database import get_db
from app.models.wardrobe import WardrobeItem
from app.schemas.wardrobe import WardrobeItemCreate, WardrobeItemUpdate, WardrobeItemResponse
from app.services.vision_service import vision_service
from app.core.security import get_current_user_id

router = APIRouter()

@router.get("", response_model=List[WardrobeItemResponse])
async def list_wardrobe_items(
    category: Optional[str] = None,
    color: Optional[str] = None,
    formality: Optional[str] = None,
    status: Optional[str] = "available",
    search: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    query = select(WardrobeItem).where(WardrobeItem.owner_id == user_id)
    if status and status != "all":
        query = query.where(WardrobeItem.status == status)
    if category and category != "All":
        query = query.where(WardrobeItem.category == category)
    if formality:
        query = query.where(WardrobeItem.formality == formality)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                WardrobeItem.name.ilike(search_pattern),
                WardrobeItem.subcategory.ilike(search_pattern),
                WardrobeItem.brand.ilike(search_pattern)
            )
        )
    
    result = await db.execute(query.order_by(WardrobeItem.created_at.desc()))
    return result.scalars().all()

@router.post("", response_model=WardrobeItemResponse)
async def create_wardrobe_item(data: WardrobeItemCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    item = WardrobeItem(
        id=str(uuid.uuid4()),
        owner_id=user_id,
        **data.model_dump()
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.get("/{item_id}", response_model=WardrobeItemResponse)
async def get_wardrobe_item(item_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id, WardrobeItem.owner_id == user_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/{item_id}", response_model=WardrobeItemResponse)
async def update_wardrobe_item(item_id: str, data: WardrobeItemUpdate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id, WardrobeItem.owner_id == user_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    item.sync_version += 1
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}")
async def delete_wardrobe_item(item_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id, WardrobeItem.owner_id == user_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.status = "archived"
    await db.commit()
    return {"status": "success", "message": "Item archived successfully"}

@router.post("/vision/prefill")
async def vision_prefill(labels: List[str] = Query(default=[]), color: str = Query(default="White")):
    return vision_service.extract_attributes_from_labels(labels, color)
