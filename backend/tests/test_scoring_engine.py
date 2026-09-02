import pytest
from datetime import datetime, timedelta
from app.models.wardrobe import WardrobeItem
from app.models.user import Preference
from app.services.scoring_engine import scoring_engine

def test_hard_filters_weather():
    items = [
        WardrobeItem(id="1", owner_id="u1", category="Outerwear", subcategory="Coats", name="Heavy Winter Parka", seasons=["Winter"], formality="Casual", status="available"),
        WardrobeItem(id="2", owner_id="u1", category="Bottoms", subcategory="Shorts", name="Summer Linen Shorts", seasons=["Summer"], formality="Casual", status="available"),
        WardrobeItem(id="3", owner_id="u1", category="Tops", subcategory="Shirts", name="Oxford Shirt", seasons=["Spring", "Summer"], formality="Smart Casual", status="available"),
    ]
    
    # In hot weather (30?C), heavy winter coat should be excluded
    hot_valid = scoring_engine.evaluate_hard_filters(items, occasion="Casual", temp_c=30.0, rain_prob=0.0)
    assert not any(i.name == "Heavy Winter Parka" for i in hot_valid)
    assert any(i.name == "Summer Linen Shorts" for i in hot_valid)
    
    # In cold weather (8?C), summer shorts should be excluded
    cold_valid = scoring_engine.evaluate_hard_filters(items, occasion="Casual", temp_c=8.0, rain_prob=0.0)
    assert not any(i.name == "Summer Linen Shorts" for i in cold_valid)

def test_soft_scoring_and_recent_use_penalty():
    pref = Preference(id="p1", user_id="u1", style_preferences=["Minimal", "Casual"], preferred_colors=["White", "Navy"])
    
    # Outfit A: Worn yesterday (penalized)
    top_recent = WardrobeItem(
        id="t1", owner_id="u1", category="Tops", subcategory="Shirts", name="White Oxford",
        colors=["White"], formality="Smart Casual", last_worn_date=datetime.utcnow() - timedelta(days=1),
        status="available"
    )
    # Outfit B: Not worn in 25 days (boosted)
    top_fresh = WardrobeItem(
        id="t2", owner_id="u1", category="Tops", subcategory="Shirts", name="White Linen",
        colors=["White"], formality="Smart Casual", last_worn_date=datetime.utcnow() - timedelta(days=25),
        status="available"
    )
    bottom = WardrobeItem(
        id="b1", owner_id="u1", category="Bottoms", subcategory="Trousers", name="Navy Chinos",
        colors=["Navy"], formality="Smart Casual", status="available"
    )
    shoes = WardrobeItem(
        id="s1", owner_id="u1", category="Footwear", subcategory="Sneakers", name="White Leather Sneakers",
        colors=["White"], formality="Casual", status="available"
    )
    
    cand_recent = scoring_engine.score_candidate([top_recent, bottom, shoes], occasion="Dinner", temp_c=22.0, rain_prob=0.0, preference=pref)
    cand_fresh = scoring_engine.score_candidate([top_fresh, bottom, shoes], occasion="Dinner", temp_c=22.0, rain_prob=0.0, preference=pref)
    
    # Fresh candidate score should be higher due to recent use penalty on recent top
    assert cand_fresh.score > cand_recent.score
    assert "recent_use_balance" in cand_fresh.reason_codes
