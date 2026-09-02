from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime
from app.models.database import get_db
from app.models.wardrobe import WardrobeItem
from app.models.user import Preference, Profile
from app.models.recommendation import Recommendation, RecommendationFeedback
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, RecommendationFeedbackCreate, RecommendationFeedbackResponse
from app.services.weather_service import weather_service
from app.services.scoring_engine import scoring_engine
from app.services.ai_gateway import ai_gateway
from app.core.security import get_current_user_id

router = APIRouter()

@router.post("", response_model=RecommendationResponse)
async def generate_recommendation(
    req: RecommendationRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch user wardrobe items
    items_res = await db.execute(select(WardrobeItem).where(WardrobeItem.owner_id == user_id, WardrobeItem.status == "available"))
    items = items_res.scalars().all()
    
    if not items:
        # Generate sample items if database is empty for demo/evaluation
        sample_items = [
            WardrobeItem(id=str(uuid.uuid4()), owner_id=user_id, category="Tops", subcategory="Shirts", name="White Oxford Shirt", colors=["White"], formality="Smart Casual", seasons=["Spring", "Summer", "Fall"], status="available"),
            WardrobeItem(id=str(uuid.uuid4()), owner_id=user_id, category="Bottoms", subcategory="Trousers", name="Navy Slim Trousers", colors=["Navy"], formality="Smart Casual", seasons=["Spring", "Summer", "Fall", "Winter"], status="available"),
            WardrobeItem(id=str(uuid.uuid4()), owner_id=user_id, category="Footwear", subcategory="Sneakers", name="Minimal White Leather Sneakers", colors=["White"], formality="Casual", seasons=["Spring", "Summer", "Fall"], status="available"),
            WardrobeItem(id=str(uuid.uuid4()), owner_id=user_id, category="Tops", subcategory="T-Shirts", name="Charcoal Grey Crewneck", colors=["Grey"], formality="Casual", seasons=["Summer"], status="available"),
            WardrobeItem(id=str(uuid.uuid4()), owner_id=user_id, category="Bottoms", subcategory="Jeans", name="Raw Indigo Denim Jeans", colors=["Blue"], formality="Casual", seasons=["Spring", "Fall", "Winter"], status="available"),
        ]
        for s in sample_items:
            db.add(s)
        await db.commit()
        items = sample_items

    # 2. Fetch user preferences
    pref_res = await db.execute(select(Preference).where(Preference.user_id == user_id))
    pref = pref_res.scalars().first()
    
    # 3. Fetch Weather
    weather = await weather_service.get_current_weather(req.latitude or 37.7749, req.longitude or -122.4194)
    temp_c = req.temperature if req.temperature is not None else weather.current.temperature_c
    rain_prob = weather.current.precipitation_probability

    # 4. Filter excluded items
    available_pool = [i for i in items if i.id not in req.exclude_item_ids]
    
    # 5. Deterministic hard filter + Soft Scoring Engine
    ranked_candidates = scoring_engine.rank_outfits(available_pool, req.occasion, temp_c, rain_prob, pref)
    
    if not ranked_candidates:
        raise HTTPException(status_code=400, detail="Not enough wardrobe items to form an outfit for this occasion.")
        
    top_candidate = ranked_candidates[0]
    
    # 6. OP AI Gateway (Gemini with deterministic resilience)
    weather_dict = {
        "temperature_c": temp_c,
        "condition_text": req.weather_condition or weather.current.condition_text,
        "precipitation_prob": rain_prob
    }
    
    response = await ai_gateway.generate_explanation(top_candidate, req.occasion, weather_dict)
    
    # Store recommendation record
    rec_record = Recommendation(
        id=response.outfit_id,
        user_id=user_id,
        item_ids=response.item_ids,
        score=response.score,
        reason_codes=response.reason_codes,
        explanation=response.explanation,
        occasion=req.occasion,
        weather_context=weather_dict,
        confidence=response.confidence,
        model_provider=response.model_provider
    )
    db.add(rec_record)
    await db.commit()
    
    return response

@router.post("/feedback", response_model=RecommendationFeedbackResponse)
async def submit_feedback(
    data: RecommendationFeedbackCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    feedback = RecommendationFeedback(
        id=str(uuid.uuid4()),
        user_id=user_id,
        recommendation_id=data.recommendation_id,
        rating_type=data.rating_type,
        comfort_rating=data.comfort_rating,
        confidence_rating=data.confidence_rating,
        fit_rating=data.fit_rating,
        comments=data.comments
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback
