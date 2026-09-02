import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.database import engine, Base

@pytest.mark.asyncio
async def test_api_health_and_end_to_end():
    # Initialize SQLite database tables for the test session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Health check
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"
        
        # 2. Register user with unique email
        test_email = f"alex.chen.{uuid.uuid4().hex[:6]}@omnipresence.ai"
        reg_res = await ac.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": "SecurePassword123!",
            "display_name": "Alex Chen"
        })
        assert reg_res.status_code == 200
        token_data = reg_res.json()
        token = token_data["access_token"]
        user_id = token_data["user_id"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Get and update profile
        prof_res = await ac.get("/api/v1/profile", headers=headers)
        assert prof_res.status_code == 200
        assert prof_res.json()["display_name"] == "Alex Chen"
        
        pref_update = await ac.put("/api/v1/profile/preferences", headers=headers, json={
            "style_preferences": ["Minimal", "Smart Casual"],
            "preferred_colors": ["White", "Navy", "Grey"],
            "disliked_colors": ["Neon Yellow"],
            "ai_personalization_enabled": True
        })
        assert pref_update.status_code == 200
        assert "Minimal" in pref_update.json()["style_preferences"]
        
        # 4. Create wardrobe items (Top, Bottom, Footwear)
        top_res = await ac.post("/api/v1/wardrobe", headers=headers, json={
            "category": "Tops",
            "subcategory": "Shirts",
            "name": "Classic White Oxford Shirt",
            "colors": ["White"],
            "material": "Cotton",
            "seasons": ["Spring", "Summer", "Fall"],
            "formality": "Smart Casual",
            "purchase_price": 85.0
        })
        assert top_res.status_code == 200
        top_id = top_res.json()["id"]
        
        bottom_res = await ac.post("/api/v1/wardrobe", headers=headers, json={
            "category": "Bottoms",
            "subcategory": "Trousers",
            "name": "Tailored Navy Chinos",
            "colors": ["Navy"],
            "material": "Cotton Twill",
            "seasons": ["Spring", "Summer", "Fall", "Winter"],
            "formality": "Smart Casual",
            "purchase_price": 110.0
        })
        assert bottom_res.status_code == 200
        bottom_id = bottom_res.json()["id"]
        
        shoes_res = await ac.post("/api/v1/wardrobe", headers=headers, json={
            "category": "Footwear",
            "subcategory": "Sneakers",
            "name": "Minimalist White Leather Low-Tops",
            "colors": ["White"],
            "material": "Leather",
            "seasons": ["Spring", "Summer", "Fall"],
            "formality": "Casual",
            "purchase_price": 130.0
        })
        assert shoes_res.status_code == 200
        shoes_id = shoes_res.json()["id"]
        
        # 5. List items with local search and filter
        search_res = await ac.get("/api/v1/wardrobe?search=Oxford", headers=headers)
        assert search_res.status_code == 200
        assert len(search_res.json()) >= 1
        assert any(i["name"] == "Classic White Oxford Shirt" for i in search_res.json())
        
        # 6. Vision attribute prefill
        vision_res = await ac.post("/api/v1/wardrobe/vision/prefill?labels=shirt&labels=cotton&color=Blue", headers=headers)
        assert vision_res.status_code == 200
        assert vision_res.json()["category"] == "Tops"
        assert vision_res.json()["subcategory"] == "Shirts"
        
        # 7. Wear event logging & stats
        wear_res = await ac.post("/api/v1/wear-events", headers=headers, json={
            "wardrobe_item_id": top_id,
            "event_context": "Dinner with team",
            "source": "manual"
        })
        assert wear_res.status_code == 200
        
        stats_res = await ac.get(f"/api/v1/wear-events/stats/{top_id}", headers=headers)
        assert stats_res.status_code == 200
        assert stats_res.json()["wear_count"] == 1
        assert stats_res.json()["cost_per_wear"] == 85.0
        
        # 8. Plan Outfit & Calendar
        outfit_res = await ac.post("/api/v1/outfits", headers=headers, json={
            "name": "Saturday Dinner Outfit",
            "item_ids": [top_id, bottom_id, shoes_id],
            "planned_date": "2026-09-05",
            "occasion": "Dinner",
            "weather_summary": {"temperature": 28, "condition": "Clear"}
        })
        assert outfit_res.status_code == 200
        
        # 9. AI Recommendation generation
        rec_res = await ac.post("/api/v1/recommendations", headers=headers, json={
            "date": "2026-09-05",
            "occasion": "Dinner",
            "temperature": 28.0,
            "weather_condition": "Clear"
        })
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert rec_data["score"] > 50.0
        assert len(rec_data["item_ids"]) >= 3
        assert rec_data["explanation"] != ""
        rec_id = rec_data["outfit_id"]
        
        # 10. Feedback submission
        fb_res = await ac.post("/api/v1/recommendations/feedback", headers=headers, json={
            "recommendation_id": rec_id,
            "rating_type": "loved_it",
            "comfort_rating": 5,
            "confidence_rating": 5,
            "fit_rating": 5,
            "comments": "Great match for the warm dinner evening!"
        })
        assert fb_res.status_code == 200
        assert fb_res.json()["rating_type"] == "loved_it"
        
        # 11. Differential sync batch test
        sync_res = await ac.post("/api/v1/sync/batch", headers=headers, json={
            "mutations": [
                {
                    "id": "mut_001",
                    "entity_type": "wardrobe_item",
                    "entity_id": top_id,
                    "mutation_type": "UPDATE",
                    "payload": {"notes": "Favorite shirt for events"},
                    "client_timestamp": "2026-09-01T20:00:00Z"
                }
            ],
            "last_synced_version": 1
        })
        assert sync_res.status_code == 200
        assert sync_res.json()["applied_count"] == 1
