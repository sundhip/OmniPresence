from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text, ForeignKey
from datetime import datetime
from app.models.database import Base

class WardrobeCategory(Base):
    __tablename__ = "wardrobe_categories"
    
    id = Column(String(64), primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False) # TOPS, BOTTOMS, OUTERWEAR, ONE_PIECE, FOOTWEAR, ACCESSORIES, BAGS, GROOMING, OTHER
    display_name = Column(String(100), nullable=False)
    subcategories = Column(JSON, default=list)

class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"
    
    id = Column(String(64), primary_key=True, index=True)
    owner_id = Column(String(64), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True) # Tops, Bottoms, Outerwear, Footwear, etc.
    subcategory = Column(String(50), nullable=False) # T-Shirts, Shirts, Jeans, etc.
    name = Column(String(150), nullable=False)
    colors = Column(JSON, default=list) # ["White", "Blue"]
    material = Column(String(50), nullable=True) # Cotton, Linen, Wool, Denim
    seasons = Column(JSON, default=list) # ["Spring", "Summer", "Fall", "Winter"]
    formality = Column(String(50), default="Casual") # Casual, Smart Casual, Formal, Sport
    fit = Column(String(50), default="Regular") # Slim, Regular, Oversized
    brand = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    purchase_date = Column(String(50), nullable=True)
    purchase_price = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    wear_count = Column(Integer, default=0)
    last_worn_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="available") # available, in_laundry, archived, donated
    embedding_ref = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sync_version = Column(Integer, default=1)

class MediaAsset(Base):
    __tablename__ = "wardrobe_media"
    
    id = Column(String(64), primary_key=True, index=True)
    owner_id = Column(String(64), nullable=False, index=True)
    item_id = Column(String(64), nullable=True)
    original_url = Column(String(500), nullable=False)
    compressed_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    file_size_kb = Column(Integer, default=0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
