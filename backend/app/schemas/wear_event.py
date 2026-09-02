from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class WearEventCreate(BaseModel):
    wardrobe_item_id: str
    outfit_id: Optional[str] = None
    event_context: str = "Daily"
    source: str = "manual"
    timestamp: Optional[datetime] = None

class WearEventResponse(BaseModel):
    id: str
    user_id: str
    wardrobe_item_id: str
    outfit_id: Optional[str] = None
    timestamp: datetime
    event_context: str
    source: str
    sync_version: int
    
    model_config = ConfigDict(from_attributes=True)

class ItemWearStats(BaseModel):
    item_id: str
    item_name: str
    wear_count: int
    last_worn_date: Optional[datetime]
    cost_per_wear: float
    days_since_last_worn: Optional[int]
