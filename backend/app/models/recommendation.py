from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text
from datetime import datetime
from app.models.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    outfit_id = Column(String(64), nullable=True)
    item_ids = Column(JSON, default=list)
    score = Column(Float, default=0.0)
    reason_codes = Column(JSON, default=list) # ["weather_match", "occasion_match", "recent_use_balance"]
    explanation = Column(Text, nullable=False)
    occasion = Column(String(100), default="Casual")
    weather_context = Column(JSON, default=dict)
    confidence = Column(Float, default=0.90)
    model_provider = Column(String(50), default="gemini-2.0-flash") # gemini-2.0-flash, gemma-4, deterministic-rule
    status = Column(String(50), default="presented") # presented, accepted, modified, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    recommendation_id = Column(String(64), nullable=False, index=True)
    rating_type = Column(String(50), nullable=False) # loved_it, fine, not_for_me
    comfort_rating = Column(Integer, default=5) # 1-5
    confidence_rating = Column(Integer, default=5) # 1-5
    fit_rating = Column(Integer, default=5) # 1-5
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
