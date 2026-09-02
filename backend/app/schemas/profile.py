from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProfileBase(BaseModel):
    display_name: str
    avatar_url: Optional[str] = None
    timezone: str = "UTC"
    locale: str = "en-US"
    gender_preference: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
    locale: Optional[str] = None
    gender_preference: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    sync_version: int
    
    model_config = ConfigDict(from_attributes=True)

class PreferenceBase(BaseModel):
    style_preferences: List[str] = ["Casual", "Minimal"]
    fit_preference: str = "Regular"
    preferred_colors: List[str] = []
    disliked_colors: List[str] = []
    preferred_categories: List[str] = []
    notification_preferences: Dict[str, Any] = {}
    ai_personalization_enabled: bool = True
    privacy_settings: Dict[str, Any] = {}

class PreferenceCreate(PreferenceBase):
    pass

class PreferenceUpdate(BaseModel):
    style_preferences: Optional[List[str]] = None
    fit_preference: Optional[str] = None
    preferred_colors: Optional[List[str]] = None
    disliked_colors: Optional[List[str]] = None
    preferred_categories: Optional[List[str]] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    ai_personalization_enabled: Optional[bool] = None
    privacy_settings: Optional[Dict[str, Any]] = None

class PreferenceResponse(PreferenceBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    sync_version: int
    
    model_config = ConfigDict(from_attributes=True)
