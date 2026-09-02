from typing import Dict, Any, List
import json

CATEGORY_MAPPING = {
    "t-shirt": ("Tops", "T-Shirts", "Casual"),
    "shirt": ("Tops", "Shirts", "Smart Casual"),
    "polo": ("Tops", "Polos", "Casual"),
    "sweater": ("Tops", "Sweaters", "Casual"),
    "jeans": ("Bottoms", "Jeans", "Casual"),
    "pants": ("Bottoms", "Trousers", "Smart Casual"),
    "trousers": ("Bottoms", "Trousers", "Smart Casual"),
    "shorts": ("Bottoms", "Shorts", "Casual"),
    "jacket": ("Outerwear", "Jackets", "Casual"),
    "coat": ("Outerwear", "Coats", "Formal"),
    "sneakers": ("Footwear", "Sneakers", "Casual"),
    "boots": ("Footwear", "Boots", "Casual"),
    "shoes": ("Footwear", "Formal", "Formal"),
}

class VisionService:
    @staticmethod
    def extract_attributes_from_labels(labels: List[str], dominant_color: str = "White") -> Dict[str, Any]:
        matched_category = "Tops"
        matched_subcategory = "Shirts"
        matched_formality = "Casual"
        
        for label in labels:
            lbl_clean = label.lower().strip()
            if lbl_clean in CATEGORY_MAPPING:
                matched_category, matched_subcategory, matched_formality = CATEGORY_MAPPING[lbl_clean]
                break
                
        return {
            "category": matched_category,
            "subcategory": matched_subcategory,
            "colors": [dominant_color],
            "formality": matched_formality,
            "seasons": ["Spring", "Summer", "Fall"],
            "material": "Cotton",
            "fit": "Regular",
            "confidence": 0.92,
            "needs_review": False
        }

vision_service = VisionService()
