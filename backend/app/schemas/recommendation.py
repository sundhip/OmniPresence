from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class RecommendationRequest(BaseModel):
    date: Optional[str] = None # YYYY-MM-DD
    occasion: str = "Dinner"
    latitude: Optional[float] = 37.7749
    longitude: Optional[float] = -122.4194
    temperature: Optional[float] = None
    weather_condition: Optional[str] = None
    preferred_category: Optional[str] = None
    exclude_item_ids: List[str] = []

class RecommendationResponse(BaseModel):
    outfit_id: str
    score: float
    reason_codes: List[str] # ["weather_match", "occasion_match", "recent_use_balance"]
    explanation: str
    item_ids: List[str]
    confidence: float
    occasion: str
    weather_context: Dict[str, Any]
    model_provider: str
    created_at: datetime

class RecommendationFeedbackCreate(BaseModel):
    recommendation_id: str
    rating_type: str # loved_it, fine, not_for_me
    comfort_rating: int = 5
    confidence_rating: int = 5
    fit_rating: int = 5
    comments: Optional[str] = None

class RecommendationFeedbackResponse(BaseModel):
    id: str
    user_id: str
    recommendation_id: str
    rating_type: str
    comfort_rating: int
    confidence_rating: int
    fit_rating: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
