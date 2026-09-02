from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from datetime import datetime
from app.models.database import Base

class WearEvent(Base):
    __tablename__ = "wear_events"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    wardrobe_item_id = Column(String(64), ForeignKey("wardrobe_items.id"), nullable=False, index=True)
    outfit_id = Column(String(64), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_context = Column(String(100), default="Daily") # Business meeting, Dinner, Casual, Presentation
    source = Column(String(50), default="manual") # manual, outfit_plan, ai_recommendation
    sync_version = Column(Integer, default=1)
