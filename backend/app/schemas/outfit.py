from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class OutfitCreate(BaseModel):
    name: str = "Planned Outfit"
    item_ids: List[str]
    planned_date: Optional[str] = None
    occasion: str = "Casual"
    weather_summary: Dict[str, Any] = {}
    score: float = 0.0
    calendar_event_id: Optional[str] = None

class OutfitUpdate(BaseModel):
    name: Optional[str] = None
    item_ids: Optional[List[str]] = None
    planned_date: Optional[str] = None
    occasion: Optional[str] = None
    weather_summary: Optional[Dict[str, Any]] = None
    score: Optional[float] = None
    status: Optional[str] = None

class OutfitResponse(BaseModel):
    id: str
    user_id: str
    name: str
    item_ids: List[str]
    planned_date: Optional[str]
    occasion: str
    weather_summary: Dict[str, Any]
    score: float
    status: str
    calendar_event_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    sync_version: int
    
    model_config = ConfigDict(from_attributes=True)

class CalendarEventCreate(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    occasion_type: str = "Casual"
    formality_level: str = "Casual"
    external_event_id: Optional[str] = None

class CalendarEventResponse(BaseModel):
    id: str
    user_id: str
    external_event_id: Optional[str]
    title: str
    start_time: datetime
    end_time: datetime
    location: Optional[str]
    occasion_type: str
    formality_level: str
    outfit_id: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
