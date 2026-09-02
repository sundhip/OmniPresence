from sqlalchemy import Column, String, Integer, DateTime, JSON, Float, Text
from datetime import datetime
from app.models.database import Base

class Outfit(Base):
    __tablename__ = "outfits"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    name = Column(String(150), default="Planned Outfit")
    item_ids = Column(JSON, default=list) # List of wardrobe item IDs
    planned_date = Column(String(50), nullable=True) # YYYY-MM-DD
    occasion = Column(String(100), default="Casual") # Dinner, Business meeting, Office
    weather_summary = Column(JSON, default=dict) # {temp: 28, condition: "Clear"}
    score = Column(Float, default=0.0)
    status = Column(String(50), default="planned") # planned, worn, archived
    calendar_event_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sync_version = Column(Integer, default=1)

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    external_event_id = Column(String(100), nullable=True)
    title = Column(String(200), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=True)
    occasion_type = Column(String(100), default="Casual")
    formality_level = Column(String(50), default="Casual")
    outfit_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
