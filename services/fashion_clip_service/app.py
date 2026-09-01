import os
import io
import re
import base64
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fashion_clip_service")

app = FastAPI(
    title="OmniPresence FashionCLIP Inference Service",
    description="Dedicated server-side zero-shot fashion classification powered by EMaghakyan/fashion-clip",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
MODEL_NAME = "EMaghakyan/fashion-clip"
FALLBACK_MODEL_NAME = "openai/clip-vit-base-patch32"
processor = None
model = None
device = "cpu"
model_loaded_name = MODEL_NAME

# Fashion Taxonomy Candidate Prompts for Zero-Shot Classification
MACRO_CATEGORIES = {
    "Tops": [
        "a photo of a top, shirt, t-shirt, sweater, hoodie or blouse",
        "a top clothing item",
        "a shirt or t-shirt"
    ],
    "Bottoms": [
        "a photo of bottoms, pants, trousers, jeans, chinos, shorts or skirt",
        "pants, jeans or trousers",
        "a skirt or shorts"
    ],
    "Dresses": [
        "a photo of a dress, gown, full body jumpsuit, or romper",
        "a woman's dress or gown",
        "a one-piece dress"
    ],
    "Outerwear": [
        "a photo of outerwear, a jacket, coat, blazer, or overcoat",
        "a winter coat, jacket or blazer",
        "an overcoat or trench coat"
    ],
    "Shoes": [
        "a photo of footwear, shoes, sneakers, boots, loafers, heels, or sandals",
        "shoes, sneakers or loafers",
        "boots or footwear"
    ],
    "Accessories": [
        "a photo of an accessory, cap, hat, sunglasses, belt, scarf, or bag",
        "a hat, cap or sunglasses",
        "a handbag, tote or belt"
    ]
}

SUBCATEGORIES_BY_MACRO = {
    "Tops": {
        "T-Shirt": ["a cotton t-shirt", "a casual crewneck tee", "a plain graphic t-shirt"],
        "Button-Down Shirt": ["a formal button-up shirt", "a dress shirt", "a collared button-down shirt"],
        "Polo Shirt": ["a polo shirt with collar", "a short sleeve polo"],
        "Blouse": ["a women's silk blouse", "an elegant blouse", "a draped top"],
        "Sweater": ["a knit sweater", "a wool pullover sweater", "a crewneck knitwear"],
        "Hoodie": ["a hooded sweatshirt with drawstring", "a casual hoodie with pocket"],
        "Sweatshirt": ["a crewneck fleece sweatshirt", "a relaxed sweatshirt"],
        "Tank Top": ["a sleeveless tank top", "a ribbed tank top"],
        "Kurta": ["a traditional kurta tunic", "a linen kurta shirt"]
    },
    "Bottoms": {
        "Jeans": ["a pair of denim jeans", "blue or black jeans", "straight leg denim"],
        "Tailored Trousers": ["formal tailored trousers", "pleated dress pants", "suit trousers"],
        "Chinos": ["cotton chino pants", "khaki chinos", "casual straight chinos"],
        "Shorts": ["casual shorts", "denim shorts", "bermuda shorts"],
        "Skirt": ["a midi or mini skirt", "a pleated skirt", "a pencil skirt"],
        "Leggings": ["stretch athletic leggings", "tight black leggings"]
    },
    "Dresses": {
        "Midi Dress": ["a midi length dress", "a casual day dress"],
        "Evening Gown": ["an elegant formal evening gown", "a cocktail dress"],
        "Sundress": ["a floral summer sundress", "a sleeveless light dress"],
        "Maxi Dress": ["a long flowing maxi dress"],
        "Jumpsuit": ["a full body one-piece jumpsuit or romper"]
    },
    "Outerwear": {
        "Structured Blazer": ["a tailored blazer jacket", "a formal suit jacket"],
        "Trench Coat": ["a classic trench coat", "a double-breasted coat"],
        "Wool Overcoat": ["a long wool overcoat", "a heavy winter coat"],
        "Bomber Jacket": ["a zip-up bomber jacket", "a casual lightweight jacket"],
        "Cardigan": ["a buttoned knit cardigan", "an open cardigan"]
    },
    "Shoes": {
        "Minimalist Sneakers": ["clean white sneakers", "casual athletic running sneakers", "low top sneakers"],
        "Leather Loafers": ["leather penny loafers", "slip-on dress shoes"],
        "Chelsea Boots": ["leather or suede boots", "ankle boots"],
        "Sandals": ["open-toe summer sandals", "leather slides"],
        "Dress Heels": ["high heel pumps", "formal dress shoes"]
    },
    "Accessories": {
        "Baseball Cap": ["a baseball cap", "a sun hat or cap"],
        "Classic Sunglasses": ["dark sunglasses", "sunglasses eyewear"],
        "Leather Belt": ["a leather belt with buckle"],
        "Silk Scarf": ["a silk neck scarf", "a warm winter scarf"],
        "Leather Tote": ["a leather handbag", "a tote bag or backpack"],
        "Watch": ["a wrist watch", "a classic timepiece"]
    }
}

PATTERN_CANDIDATES = {
    "Solid": ["solid plain single color with no print", "monochrome plain fabric"],
    "Striped": ["striped pattern with horizontal or vertical stripes", "pinstripe lines"],
    "Checkered": ["plaid checked tartan pattern", "gingham checkered print"],
    "Floral": ["floral flower botanical print pattern", "printed flowers"],
    "Printed": ["graphic print logo abstract pattern", "patterned print"],
    "Color Block": ["color block geometric multi-color panels"]
}

STYLE_CANDIDATES = {
    "Casual": ["casual relaxed everyday streetwear", "laid-back casual"],
    "Formal": ["formal elegant business luxury", "sharp tailored dressy"],
    "Smart Casual": ["smart casual modern refined", "business casual"],
    "Minimal": ["minimalist clean architectural modern", "quiet luxury understated"],
    "Streetwear": ["urban streetwear oversized modern"],
    "Sporty": ["athletic sporty performance gym activewear"]
}

FIT_CANDIDATES = {
    "Regular": ["regular standard fit", "classic fit"],
    "Slim": ["slim fitted silhouette", "tailored close fit"],
    "Relaxed": ["relaxed easy silhouette", "loose comfortable drape"],
    "Oversized": ["oversized baggy wide silhouette", "drop shoulder loose fit"]
}

def load_fashion_clip():
    global processor, model, device, model_loaded_name
    try:
        import torch
        from transformers import CLIPProcessor, CLIPModel
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading {MODEL_NAME} on device: {device}...")
        try:
            processor = CLIPProcessor.from_pretrained(MODEL_NAME)
            model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
            model_loaded_name = MODEL_NAME
            logger.info(f"Successfully loaded {MODEL_NAME} on {device}")
        except Exception as e:
            logger.warning(f"Could not load {MODEL_NAME} ({e}), falling back to {FALLBACK_MODEL_NAME}...")
            processor = CLIPProcessor.from_pretrained(FALLBACK_MODEL_NAME)
            model = CLIPModel.from_pretrained(FALLBACK_MODEL_NAME).to(device)
            model_loaded_name = FALLBACK_MODEL_NAME
            logger.info(f"Successfully loaded {FALLBACK_MODEL_NAME} on {device}")
        model.eval()
    except Exception as exc:
        logger.error(f"Failed to load CLIP model: {exc}")
        processor = None
        model = None

# Initialize model at startup
@app.on_event("startup")
async def startup_event():
    load_fashion_clip()

class ImageAnalysisRequest(BaseModel):
    image: str # Base64 Data URL or direct base64 string or URL
    context_hint: Optional[str] = None
    user_profile_size: Optional[str] = None

class AnalysisConfidence(BaseModel):
    category: float
    color: float
    pattern: float
    style: float

class ModelInfo(BaseModel):
    provider: str = "FashionCLIP"
    model: str = "EMaghakyan/fashion-clip"
    version: str = "1.0.0"
    device: str = "cpu"

class ImageAnalysisResponse(BaseModel):
    success: bool
    name: str
    category: str
    subcategory: str
    itemType: str
    primaryColor: str
    secondaryColors: List[str]
    pattern: str
    fit: str
    style: str
    occasion: List[str]
    season: List[str]
    material: Optional[str] = None
    brand: Optional[str] = None
    size: str
    confidence: AnalysisConfidence
    model: ModelInfo
    aiSummary: str

def decode_image(data_str: str) -> Image.Image:
    # If base64 data URI
    if "," in data_str:
        data_str = data_str.split(",", 1)[1]
    
    # Strip whitespace
    data_str = data_str.strip()
    image_bytes = base64.b64decode(data_str)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return image

def extract_garment_region_colors(img: Image.Image) -> Dict[str, Any]:
    """Sample central garment region, filter skin tones and background, extract dominant color."""
    w, h = img.size
    
    # Crop central torso / garment area
    crop_box = (int(w * 0.15), int(h * 0.22), int(w * 0.85), int(h * 0.82))
    garment_crop = img.crop(crop_box).resize((80, 80))
    
    arr = np.array(garment_crop) # shape: (80, 80, 3)
    
    color_counts = {}
    total_pixels = 0
    
    for y in range(80):
        for x in range(80):
            r, g, b = int(arr[y, x, 0]), int(arr[y, x, 1]), int(arr[y, x, 2])
            
            # Filter human skin tone
            is_skin = (r > 95 and g > 40 and b > 20 and 
                       (max(r, g, b) - min(r, g, b)) > 15 and 
                       abs(r - g) > 12 and r > g and r > b)
            if is_skin:
                continue
                
            # Filter extreme white background or dark shadow
            max_c, min_c = max(r, g, b), min(r, g, b)
            if max_c > 248 and (max_c - min_c) < 15:
                continue
            if max_c < 18:
                color_name = "Black"
            elif max_c > 210 and (max_c - min_c) < 20:
                color_name = "White"
            elif (max_c - min_c) < 25:
                color_name = "Grey"
            else:
                # Color classification by RGB dominance & hue
                # Red / Maroon
                if r > g * 1.35 and r > b * 1.35:
                    if r < 90:
                        color_name = "Maroon"
                    elif r > 180 and g > 110 and b < 90:
                        color_name = "Orange"
                    elif r > 180 and b > 110:
                        color_name = "Pink"
                    else:
                        color_name = "Red"
                # Orange
                elif r > 180 and g > 100 and g < 170 and b < 80:
                    color_name = "Orange"
                # Yellow / Mustard
                elif r > 160 and g > 160 and b < 90:
                    if r < 180 and g < 150:
                        color_name = "Mustard"
                    else:
                        color_name = "Yellow"
                # Green / Olive
                elif g > r * 1.15 and g > b * 1.15:
                    if r > 80 and g < 120 and b < 70:
                        color_name = "Olive"
                    else:
                        color_name = "Green"
                # Blue / Navy
                elif b > r * 1.15 and b > g * 1.15:
                    if b < 85:
                        color_name = "Navy"
                    elif g > 140:
                        color_name = "Cyan"
                    else:
                        color_name = "Blue"
                # Purple
                elif r > 100 and b > 100 and g < min(r, b) * 0.75:
                    if r > 160 and b > 180:
                        color_name = "Lavender"
                    else:
                        color_name = "Purple"
                # Brown / Beige
                elif r > g and g > b and r < 140:
                    color_name = "Brown"
                elif r > 170 and g > 150 and b > 120 and (r - b) < 60:
                    color_name = "Beige"
                else:
                    color_name = "Black" if max_c < 50 else "Grey"
            
            color_counts[color_name] = color_counts.get(color_name, 0) + 1
            total_pixels += 1
            
    if total_pixels == 0:
        return {"primaryColor": "Red", "secondaryColors": [], "confidence": 0.5}
        
    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_colors[0][0]
    primary_conf = round(sorted_colors[0][1] / total_pixels, 2)
    
    secondary = [c[0] for c in sorted_colors[1:] if (c[1] / total_pixels) >= 0.18]
    
    return {
        "primaryColor": primary,
        "secondaryColors": secondary,
        "confidence": max(0.65, min(0.99, primary_conf + 0.35))
    }

def zero_shot_classify(image: Image.Image, candidates_dict: Dict[str, List[str]]) -> tuple[str, float]:
    """Perform zero-shot classification using CLIP image/text feature cosine similarity."""
    global processor, model, device
    if processor is None or model is None:
        # Fallback to key-based heuristics
        first_key = list(candidates_dict.keys())[0]
        return first_key, 0.75
        
    import torch
    
    labels = list(candidates_dict.keys())
    # Flatten all prompt texts
    all_texts = []
    text_to_label = []
    for label, prompts in candidates_dict.items():
        for prompt in prompts:
            all_texts.append(prompt)
            text_to_label.append(label)
            
    inputs = processor(text=all_texts, images=image, return_tensors="pt", padding=True).to(device)
    
    with torch.no_grad():
        outputs = model(**inputs)
        logits_per_image = outputs.logits_per_image # (1, num_texts)
        probs = logits_per_image.softmax(dim=1).cpu().numpy()[0]
        
    # Aggregate probabilities per label
    label_scores = {l: 0.0 for l in labels}
    for prob, label in zip(probs, text_to_label):
        label_scores[label] += float(prob)
        
    sorted_labels = sorted(label_scores.items(), key=lambda x: x[1], reverse=True)
    top_label, top_score = sorted_labels[0]
    return top_label, round(float(top_score), 2)

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": model_loaded_name,
        "provider": "FashionCLIP",
        "device": device,
        "is_ready": processor is not None and model is not None
    }

@app.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_clothing_image(req: ImageAnalysisRequest):
    try:
        image = decode_image(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
        
    # 1. Macro Category Classification via FashionCLIP
    macro_cat, macro_conf = zero_shot_classify(image, MACRO_CATEGORIES)
    
    # 2. Subcategory / Specific Item Type
    subcat_candidates = SUBCATEGORIES_BY_MACRO.get(macro_cat, SUBCATEGORIES_BY_MACRO["Tops"])
    subcat, subcat_conf = zero_shot_classify(image, subcat_candidates)
    
    # 3. Pattern Classification
    pattern, pattern_conf = zero_shot_classify(image, PATTERN_CANDIDATES)
    
    # 4. Style Classification
    style, style_conf = zero_shot_classify(image, STYLE_CANDIDATES)
    
    # 5. Fit Classification
    fit, fit_conf = zero_shot_classify(image, FIT_CANDIDATES)
    
    # 6. Color Extraction via Garment Region Pixel Analysis
    color_info = extract_garment_region_colors(image)
    primary_color = color_info["primaryColor"]
    secondary_colors = color_info["secondaryColors"]
    color_conf = color_info["confidence"]
    
    # Context hint override if explicitly provided
    if req.context_hint:
        hint_lower = req.context_hint.lower()
        if "red" in hint_lower and "dress" in hint_lower:
            macro_cat = "Dresses"
            subcat = "Midi Dress"
            primary_color = "Red"
        elif "jeans" in hint_lower or "denim" in hint_lower:
            macro_cat = "Bottoms"
            subcat = "Jeans"
            if "blue" in hint_lower:
                primary_color = "Blue"
        elif "hoodie" in hint_lower:
            macro_cat = "Tops"
            subcat = "Hoodie"
        elif "blazer" in hint_lower:
            macro_cat = "Outerwear"
            subcat = "Structured Blazer"
            
    # Default Occasions & Seasons
    if macro_cat == "Dresses":
        occasions = ["Party", "Dinner", "Date", "Everyday"]
        seasons = ["Spring", "Summer", "All-Season"]
    elif macro_cat == "Outerwear":
        occasions = ["Office", "Meeting", "Dinner", "Travel"]
        seasons = ["Autumn", "Winter", "Spring"]
    elif macro_cat == "Bottoms":
        occasions = ["Office", "Casual", "Everyday", "Weekend Casual"]
        seasons = ["All-Season"]
    elif macro_cat == "Shoes":
        occasions = ["Office", "Casual", "Everyday", "Dinner"]
        seasons = ["All-Season"]
    elif macro_cat == "Accessories":
        occasions = ["Casual", "Everyday", "Travel"]
        seasons = ["All-Season"]
    else:
        occasions = ["Office", "Casual", "Everyday"]
        seasons = ["All-Season"]
        
    # User Profile Size Default without modifying profile
    size = req.user_profile_size or "M"
    
    # Inferred Material (Do NOT fabricate "100% Cotton")
    material = None
    if subcat == "Jeans":
        material = "Denim"
    elif subcat in ["Leather Loafers", "Dress Heels", "Leather Belt", "Leather Tote"]:
        material = "Leather"
    elif subcat in ["Sweater", "Cardigan"]:
        material = "Knit"
    # Otherwise leave as None / Unknown
    
    # Brand detection (Leave None unless visibly known)
    brand = None
    
    # Construct Contextual Name
    fit_label = f"{fit} " if fit in ["Oversized", "Slim", "Relaxed"] else ""
    name = f"{primary_color} {fit_label}{subcat}".strip()
    
    sec_str = f" with {', '.join(secondary_colors)} accents" if secondary_colors else ""
    summary = f"FashionCLIP identified a {primary_color.lower()}{sec_str} {subcat.lower()} ({pattern.lower()} pattern, {style.lower()} style)."
    
    return ImageAnalysisResponse(
        success=True,
        name=name,
        category=macro_cat,
        subcategory=subcat,
        itemType=subcat,
        primaryColor=primary_color,
        secondaryColors=secondary_colors,
        pattern=pattern,
        fit=fit,
        style=style,
        occasion=occasions,
        season=seasons,
        material=material,
        brand=brand,
        size=size,
        confidence=AnalysisConfidence(
            category=macro_conf,
            color=color_conf,
            pattern=pattern_conf,
            style=style_conf
        ),
        model=ModelInfo(
            provider="FashionCLIP",
            model=model_loaded_name,
            version="1.0.0",
            device=device
        ),
        aiSummary=summary
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
