from sqlalchemy import Column, String, Integer, DateTime, JSON, Text
from datetime import datetime
from app.models.database import Base

class SyncMutation(Base):
    __tablename__ = "sync_mutations"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False) # wardrobe_item, wear_event, outfit, profile, preference
    entity_id = Column(String(64), nullable=False)
    mutation_type = Column(String(50), nullable=False) # INSERT, UPDATE, DELETE
    payload = Column(JSON, nullable=False)
    client_timestamp = Column(DateTime, nullable=False)
    status = Column(String(50), default="pending") # pending, synced, conflict, failed
    created_at = Column(DateTime, default=datetime.utcnow)

class ActionLog(Base):
    __tablename__ = "action_logs"
    
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
