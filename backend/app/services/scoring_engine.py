from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from app.models.wardrobe import WardrobeItem
from app.models.user import Preference

# Color Harmony Matrix
COLOR_HARMONIES = {
    "white": ["navy", "black", "blue", "grey", "olive", "beige", "brown", "burgundy", "denim"],
    "black": ["white", "grey", "charcoal", "red", "blue", "beige", "camel", "olive"],
    "navy": ["white", "grey", "beige", "brown", "tan", "light blue", "pink"],
    "grey": ["white", "black", "navy", "burgundy", "pink", "blue"],
    "beige": ["navy", "white", "brown", "olive", "black", "burgundy"],
    "blue": ["white", "grey", "beige", "brown", "black"],
    "olive": ["white", "black", "beige", "grey", "navy"],
    "brown": ["white", "navy", "blue", "beige", "cream"],
    "denim": ["white", "grey", "black", "navy", "red", "beige"],
}

class CandidateOutfit:
    def __init__(self, items: List[WardrobeItem], score: float, score_breakdown: Dict[str, float], reason_codes: List[str]):
        self.items = items
        self.score = score
        self.score_breakdown = score_breakdown
        self.reason_codes = reason_codes

class RuleScoringEngine:
    def __init__(self):
        self.weights = {
            "style": 0.20,
            "color": 0.15,
            "weather": 0.15,
            "occasion": 0.15,
            "preference": 0.15,
            "recent_use": 0.10,
            "novelty": 0.10
        }

    def evaluate_hard_filters(self, items: List[WardrobeItem], occasion: str, temp_c: float, rain_prob: float) -> List[WardrobeItem]:
        valid_items = []
        for item in items:
            # Filter out non-available items
            if item.status != "available":
                continue
            
            seasons = item.seasons or []
            # Weather hard constraints
            if temp_c > 26.0 and any(s in ["Winter", "Heavy"] for s in seasons) and item.category == "Outerwear":
                continue
            if temp_c < 12.0 and item.subcategory in ["Shorts", "Sandals", "Tank Top"]:
                continue
            
            # Formality hard constraints
            if occasion in ["Business meeting", "Formal", "Black Tie"]:
                if item.formality in ["Sport", "Loungewear"] or item.subcategory in ["Joggers", "Sandals", "Graphic Tee"]:
                    continue
                    
            valid_items.append(item)
        return valid_items

    def generate_candidate_combinations(self, items: List[WardrobeItem], occasion: str, temp_c: float, rain_prob: float) -> List[List[WardrobeItem]]:
        valid_items = self.evaluate_hard_filters(items, occasion, temp_c, rain_prob)
        
        tops = [i for i in valid_items if i.category in ["Tops", "Top"]]
        bottoms = [i for i in valid_items if i.category in ["Bottoms", "Bottom"]]
        footwear = [i for i in valid_items if i.category in ["Footwear", "Shoes"]]
        outerwear = [i for i in valid_items if i.category in ["Outerwear", "Jackets"]]
        
        candidates = []
        
        # Primary standard combination: Top + Bottom + Footwear (+ Optional Outerwear if cold)
        for top in tops[:8]:
            for bottom in bottoms[:8]:
                for shoes in footwear[:5]:
                    combo = [top, bottom, shoes]
                    if temp_c < 18.0 and outerwear:
                        combo.append(outerwear[0])
                    candidates.append(combo)
                    
        return candidates

    def score_candidate(self, combo: List[WardrobeItem], occasion: str, temp_c: float, rain_prob: float, preference: Optional[Preference]) -> CandidateOutfit:
        now = datetime.utcnow()
        reason_codes = []
        
        # 1. Style Compatibility (0 - 100)
        raw_styles = (preference.style_preferences if preference and preference.style_preferences else ["casual", "minimal"])
        user_styles = [s.lower() for s in raw_styles]
        style_matches = 0
        for item in combo:
            formality_str = (item.formality or "casual").lower()
            notes_str = (item.notes or "").lower()
            if formality_str in user_styles or any(s in notes_str for s in user_styles):
                style_matches += 1
        s_style = min(100.0, 50.0 + (style_matches / max(len(combo), 1)) * 50.0)
        
        # 2. Color Harmony (0 - 100)
        all_colors = []
        for item in combo:
            for c in (item.colors or []):
                all_colors.append(c.lower())
        
        color_score = 75.0
        if len(all_colors) >= 2:
            base_color = all_colors[0]
            harmonies = COLOR_HARMONIES.get(base_color, ["white", "black", "grey", "navy"])
            matching = sum(1 for c in all_colors[1:] if c in harmonies or c == base_color)
            color_score = min(100.0, 60.0 + (matching / max(len(all_colors) - 1, 1)) * 40.0)
            if color_score >= 85:
                reason_codes.append("color_harmony")
        s_color = color_score

        # 3. Weather Fit (0 - 100)
        weather_points = 80.0
        if temp_c >= 24.0: # Warm
            warm_items = sum(1 for i in combo if "Summer" in (i.seasons or []) or i.material in ["Cotton", "Linen"])
            weather_points += (warm_items / len(combo)) * 20.0
            reason_codes.append("weather_match")
        elif temp_c <= 15.0: # Cold
            cold_items = sum(1 for i in combo if "Fall" in (i.seasons or []) or "Winter" in (i.seasons or []) or i.category == "Outerwear")
            weather_points += (cold_items / len(combo)) * 20.0
            reason_codes.append("weather_match")
        s_weather = min(100.0, weather_points)

        # 4. Occasion Fit (0 - 100)
        occasion_points = 70.0
        if occasion.lower() in ["dinner", "date", "smart casual"]:
            if any(i.formality in ["Smart Casual", "Formal"] for i in combo):
                occasion_points += 25.0
                reason_codes.append("occasion_match")
        elif occasion.lower() in ["business", "formal", "office"]:
            if all(i.formality in ["Smart Casual", "Formal"] for i in combo):
                occasion_points += 30.0
                reason_codes.append("occasion_match")
        else: # Casual
            occasion_points += 20.0
            reason_codes.append("occasion_match")
        s_occasion = min(100.0, occasion_points)

        # 5. Personal Preference (0 - 100)
        pref_points = 75.0
        raw_favs = (preference.preferred_colors if preference and preference.preferred_colors else [])
        raw_disliked = (preference.disliked_colors if preference and preference.disliked_colors else [])
        fav_colors = [c.lower() for c in raw_favs]
        disliked_colors = [c.lower() for c in raw_disliked]
        
        for c in all_colors:
            if c in fav_colors:
                pref_points += 10.0
            if c in disliked_colors:
                pref_points -= 20.0
        s_pref = max(30.0, min(100.0, pref_points))

        # 6. Recent Use Balance (0 - 100)
        recent_points = 80.0
        unworn_boost = False
        for item in combo:
            if item.last_worn_date:
                days_ago = (now - item.last_worn_date).days
                if days_ago < 3:
                    recent_points -= 25.0 # Penalize very recent wear
                elif days_ago > 14:
                    recent_points += 10.0 # Boost unworn items
                    unworn_boost = True
            else:
                recent_points += 10.0
                unworn_boost = True
        if unworn_boost:
            reason_codes.append("recent_use_balance")
        s_recent = max(20.0, min(100.0, recent_points))

        # 7. Novelty Exploration (0 - 100)
        s_novelty = 78.0

        # Compute weighted final score
        final_score = (
            self.weights["style"] * s_style +
            self.weights["color"] * s_color +
            self.weights["weather"] * s_weather +
            self.weights["occasion"] * s_occasion +
            self.weights["preference"] * s_pref +
            self.weights["recent_use"] * s_recent +
            self.weights["novelty"] * s_novelty
        )

        breakdown = {
            "style": round(s_style, 1),
            "color": round(s_color, 1),
            "weather": round(s_weather, 1),
            "occasion": round(s_occasion, 1),
            "preference": round(s_pref, 1),
            "recent_use": round(s_recent, 1),
            "novelty": round(s_novelty, 1)
        }

        return CandidateOutfit(
            items=combo,
            score=round(final_score, 1),
            score_breakdown=breakdown,
            reason_codes=list(set(reason_codes))
        )

    def rank_outfits(self, items: List[WardrobeItem], occasion: str, temp_c: float, rain_prob: float, preference: Optional[Preference]) -> List[CandidateOutfit]:
        combinations = self.generate_candidate_combinations(items, occasion, temp_c, rain_prob)
        if not combinations:
            return []
        
        scored = [self.score_candidate(combo, occasion, temp_c, rain_prob, preference) for combo in combinations]
        scored.sort(key=lambda x: x.score, reverse=True)
        return scored

scoring_engine = RuleScoringEngine()
