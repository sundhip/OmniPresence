import pytest
from app.services.ai_gateway import ai_gateway
from app.models.wardrobe import WardrobeItem
from app.services.scoring_engine import CandidateOutfit

@pytest.mark.asyncio
async def test_ai_gateway_deterministic_fallback():
    items = [
        WardrobeItem(id="1", owner_id="u1", category="Tops", subcategory="Shirts", name="White Oxford Shirt", colors=["White"], formality="Smart Casual", status="available"),
        WardrobeItem(id="2", owner_id="u1", category="Bottoms", subcategory="Trousers", name="Navy Trousers", colors=["Navy"], formality="Smart Casual", status="available"),
        WardrobeItem(id="3", owner_id="u1", category="Footwear", subcategory="Sneakers", name="White Sneakers", colors=["White"], formality="Casual", status="available"),
    ]
    candidate = CandidateOutfit(
        items=items,
        score=92.5,
        score_breakdown={"style": 90, "color": 95, "weather": 92, "occasion": 90, "preference": 90, "recent_use": 95, "novelty": 80},
        reason_codes=["weather_match", "occasion_match", "recent_use_balance"]
    )
    
    rec = await ai_gateway.generate_explanation(
        candidate=candidate,
        occasion="Dinner",
        weather_info={"temperature_c": 28.0, "condition_text": "Clear", "precipitation_prob": 0.0}
    )
    
    assert rec.score == 92.5
    assert len(rec.item_ids) == 3
    assert "White Oxford Shirt" in rec.explanation
    assert "Navy Trousers" in rec.explanation
    assert "Dinner" in rec.occasion or "dinner" in rec.explanation.lower()
    assert rec.confidence >= 0.90
