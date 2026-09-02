from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class WardrobeItemBase(BaseModel):
    category: str
    subcategory: str
    name: str
    colors: List[str] = []
    material: Optional[str] = None
    seasons: List[str] = ["Spring", "Summer", "Fall", "Winter"]
    formality: str = "Casual"
    fit: str = "Regular"
    brand: Optional[str] = None
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: float = 0.0
    notes: Optional[str] = None
    status: str = "available"

class WardrobeItemCreate(WardrobeItemBase):
    pass

class WardrobeItemUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    name: Optional[str] = None
    colors: Optional[List[str]] = None
    material: Optional[str] = None
    seasons: Optional[List[str]] = None
    formality: Optional[str] = None
    fit: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    wear_count: Optional[int] = None

class WardrobeItemResponse(WardrobeItemBase):
    id: str
    owner_id: str
    wear_count: int
    last_worn_date: Optional[datetime] = None
    embedding_ref: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    sync_version: int
    
    model_config = ConfigDict(from_attributes=True)

class WardrobeFilter(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    color: Optional[str] = None
    season: Optional[str] = None
    formality: Optional[str] = None
    status: Optional[str] = "available"
    search_query: Optional[str] = None
