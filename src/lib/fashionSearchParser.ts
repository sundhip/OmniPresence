import {
  OP_FASHION_TAXONOMY,
  getStylesForCategory,
  TaxonomyStyle,
} from "./fashionTaxonomy";
import { FashionParsedQuery } from "@/types/marketplace";

const GENDER_KEYWORDS: Record<string, "Women" | "Men" | "Unisex"> = {
  women: "Women",
  womens: "Women",
  "women's": "Women",
  female: "Women",
  ladies: "Women",
  lady: "Women",
  girl: "Women",
  girls: "Women",
  men: "Men",
  mens: "Men",
  "men's": "Men",
  male: "Men",
  gents: "Men",
  gentlemen: "Men",
  gentleman: "Men",
  guy: "Men",
  guys: "Men",
  boy: "Men",
  boys: "Men",
  unisex: "Unisex",
};

const COLOR_KEYWORDS = [
  "black",
  "white",
  "navy",
  "blue",
  "red",
  "green",
  "olive",
  "beige",
  "brown",
  "pink",
  "yellow",
  "purple",
  "burgundy",
  "maroon",
  "grey",
  "gray",
  "cream",
  "gold",
  "silver",
  "orange",
  "cyan",
  "tan",
  "charcoal",
  "emerald",
  "mustard",
  "indigo",
  "lavender",
  "teal",
  "coral",
  "khaki",
  "rust",
];

const FIT_KEYWORDS: Record<string, string> = {
  oversized: "Oversized",
  baggy: "Oversized",
  loose: "Oversized",
  "drop shoulder": "Oversized",
  "boxy": "Oversized",
  slim: "Slim",
  "slim-fit": "Slim",
  "slim fit": "Slim",
  skinny: "Slim",
  fitted: "Slim",
  tailored: "Tailored",
  relaxed: "Relaxed",
  "relaxed-fit": "Relaxed",
  "relaxed fit": "Relaxed",
  regular: "Regular",
  "regular-fit": "Regular",
  "regular fit": "Regular",
  classic: "Regular",
};

const STYLE_KEYWORDS: Record<string, string> = {
  formal: "Formal",
  business: "Formal",
  executive: "Formal",
  casual: "Casual",
  smart: "Smart Casual",
  "smart casual": "Smart Casual",
  streetwear: "Streetwear",
  street: "Streetwear",
  urban: "Streetwear",
  minimal: "Minimal",
  minimalist: "Minimal",
  traditional: "Traditional",
  ethnic: "Traditional",
  sporty: "Sporty",
  athletic: "Sporty",
  vintage: "Vintage",
  retro: "Vintage",
  boho: "Bohemian",
  bohemian: "Bohemian",
  party: "Party",
};

const PATTERN_KEYWORDS: Record<string, string> = {
  floral: "Floral",
  flowers: "Floral",
  striped: "Striped",
  stripes: "Striped",
  pinstripe: "Striped",
  check: "Check",
  checked: "Check",
  plaid: "Plaid",
  printed: "Printed",
  print: "Printed",
  "polka dot": "Polka Dot",
  polkadot: "Polka Dot",
  solid: "Solid",
  plain: "Plain",
};

const OCCASION_KEYWORDS: Record<string, string> = {
  wedding: "Weddings / Functions",
  reception: "Weddings / Functions",
  marriage: "Weddings / Functions",
  sangeet: "Weddings / Functions",
  party: "Party",
  club: "Party",
  cocktail: "Party",
  office: "Office",
  work: "Office",
  meeting: "Office",
  business: "Office",
  formal: "Formal Event",
  interview: "Office",
  casual: "Casual Outings",
  daily: "Everyday",
  everyday: "Everyday",
  college: "College",
  date: "Date",
  festival: "Festivals",
  diwali: "Festivals",
  eid: "Festivals",
  pooja: "Festivals",
  travel: "Travel",
  vacation: "Travel",
  gym: "Gym / Sports",
  workout: "Gym / Sports",
};

const SEASON_KEYWORDS: Record<string, string> = {
  summer: "Summer",
  hot: "Summer",
  sunny: "Summer",
  beach: "Summer",
  winter: "Winter",
  cold: "Winter",
  warm: "Winter",
  monsoon: "Rainy",
  rain: "Rainy",
  spring: "Spring",
  autumn: "Autumn",
  fall: "Autumn",
};

export function parseFashionSearchQuery(
  rawQuery: string,
  defaultGender?: "Women" | "Men" | "Unisex" | "All"
): FashionParsedQuery {
  const query = rawQuery.trim();
  const lower = query.toLowerCase();

  let category: string | undefined;
  let subcategory: string | undefined;
  let matchedStyle: TaxonomyStyle | undefined;
  let detectedColor: string | undefined;
  let detectedPattern: string | undefined;
  let detectedFit: string | undefined;
  let detectedStyle: string | undefined;
  let detectedOccasion: string | undefined;
  let detectedSeason: string | undefined;
  let detectedGender: "Women" | "Men" | "Unisex" | "All" | undefined;
  let detectedBudgetMax: number | undefined;
  let comfortPriority = false;

  // 1. Gender extraction
  for (const [kw, g] of Object.entries(GENDER_KEYWORDS)) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(lower)) {
      detectedGender = g;
      break;
    }
  }
  if (!detectedGender && defaultGender && defaultGender !== "All") {
    detectedGender = defaultGender;
  }

  // 2. Budget extraction (handles "under 1500", "below ₹2000", "under 1.5k", "under 2k")
  const budgetKMatch = lower.match(/(?:under|below|less than|within|budget|max|rs\.?|₹)\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (budgetKMatch && budgetKMatch[1]) {
    detectedBudgetMax = Math.round(parseFloat(budgetKMatch[1]) * 1000);
  } else {
    const budgetMatches = lower.match(/(?:under|below|less than|within|budget|max|rs\.?|₹)\s*(\d{2,6})/i);
    if (budgetMatches && budgetMatches[1]) {
      detectedBudgetMax = parseInt(budgetMatches[1], 10);
    }
  }

  // 3. Color extraction
  for (const c of COLOR_KEYWORDS) {
    const regex = new RegExp(`\\b${c}\\b`, "i");
    if (regex.test(lower)) {
      detectedColor = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // 4. Fit extraction
  for (const [kw, fitVal] of Object.entries(FIT_KEYWORDS)) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(lower)) {
      detectedFit = fitVal;
      break;
    }
  }

  // 5. Style extraction
  for (const [kw, stVal] of Object.entries(STYLE_KEYWORDS)) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(lower)) {
      detectedStyle = stVal;
      break;
    }
  }

  // 6. Pattern extraction
  for (const [kw, pat] of Object.entries(PATTERN_KEYWORDS)) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(lower)) {
      detectedPattern = pat;
      break;
    }
  }

  // 7. Occasion extraction
  for (const [kw, occ] of Object.entries(OCCASION_KEYWORDS)) {
    if (lower.includes(kw)) {
      detectedOccasion = occ;
      break;
    }
  }

  // 8. Season extraction
  for (const [kw, sea] of Object.entries(SEASON_KEYWORDS)) {
    if (lower.includes(kw)) {
      detectedSeason = sea;
      break;
    }
  }

  // 9. Comfort extraction
  if (lower.includes("comfort") || lower.includes("breezy") || lower.includes("relaxed") || lower.includes("easy")) {
    comfortPriority = true;
  }

  // 10. Direct Category & Subcategory Identification
  if (/\b(kurta|kurti|saree|sari|lehenga|salwar|sherwani|dhoti|pajama|pyjama|indowestern|ethnic)\b/i.test(lower)) {
    category = "Ethnic Wear";
    if (lower.includes("kurta pajama") || lower.includes("kurta pyjama")) {
      subcategory = "Kurta Pyjama";
    } else if (lower.includes("kurta")) {
      subcategory = "Kurta";
    } else if (lower.includes("kurti")) {
      subcategory = "Kurti";
    } else if (lower.includes("saree") || lower.includes("sari")) {
      subcategory = "Saree";
    } else if (lower.includes("lehenga")) {
      subcategory = "Lehenga";
    } else if (lower.includes("sherwani")) {
      subcategory = "Sherwani";
    } else if (lower.includes("salwar")) {
      subcategory = "Salwar Suit";
    } else {
      subcategory = "Ethnic Wear";
    }
  } else if (/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i.test(lower)) {
    category = "Tops";
    subcategory = "Hoodie";
  } else if (/\b(shirt|shirts|oxford|formal shirt|linen shirt|button down)\b/i.test(lower)) {
    category = "Tops";
    if (lower.includes("formal") || detectedStyle === "Formal") {
      subcategory = "Formal Shirt";
    } else if (lower.includes("linen")) {
      subcategory = "Linen Shirt";
    } else if (lower.includes("polo")) {
      subcategory = "Polo Shirt";
    } else {
      subcategory = "Shirts";
    }
  } else if (/\b(t-shirt|tshirt|tee|tees)\b/i.test(lower)) {
    category = "Tops";
    subcategory = "T-Shirts";
  } else if (/\b(sweater|sweaters|cardigan|knitwear|pullover)\b/i.test(lower)) {
    category = "Tops";
    subcategory = "Sweaters";
  } else if (/\b(top|tops|blouse|tank top|crop top)\b/i.test(lower)) {
    category = "Tops";
    subcategory = lower.includes("blouse") ? "Blouse" : lower.includes("crop") ? "Crop Top" : "Tops";
  } else if (/\b(jeans|denim|pants|trousers|chinos|shorts|skirt|joggers|cargo|cargo pants|leggings|bottoms)\b/i.test(lower)) {
    category = "Bottoms";
    if (lower.includes("jeans") || lower.includes("denim")) subcategory = "Jeans";
    else if (lower.includes("chino")) subcategory = "Chinos";
    else if (lower.includes("cargo")) subcategory = "Cargo Pants";
    else if (lower.includes("jogger")) subcategory = "Joggers";
    else if (lower.includes("short")) subcategory = "Shorts";
    else if (lower.includes("skirt")) subcategory = "Skirt";
    else subcategory = "Trousers";
  } else if (/\b(dress|dresses|gown|frock|sundress|maxi|midi|mini|jumpsuit)\b/i.test(lower)) {
    category = "Dresses";
    if (lower.includes("summer") || detectedSeason === "Summer") subcategory = "Summer Dress";
    else if (lower.includes("maxi")) subcategory = "Maxi Dress";
    else if (lower.includes("midi")) subcategory = "Midi Dress";
    else if (lower.includes("mini")) subcategory = "Mini Dress";
    else if (lower.includes("gown") || lower.includes("evening")) subcategory = "Evening Gown";
    else subcategory = "Dresses";
    if (!detectedGender) detectedGender = "Women";
  } else if (/\b(blazer|blazers|coat|coats|jacket|jackets|overcoat|trench coat|outerwear)\b/i.test(lower)) {
    category = "Outerwear";
    if (lower.includes("blazer")) subcategory = "Blazers";
    else if (lower.includes("trench")) subcategory = "Trench Coat";
    else if (lower.includes("coat")) subcategory = "Overcoat";
    else subcategory = "Jackets";
  } else if (/\b(shoes|sneakers|loafers|boots|sandals|heels|flats|footwear|kicks)\b/i.test(lower)) {
    category = "Footwear";
    if (lower.includes("sneaker") || lower.includes("kicks")) subcategory = "Sneakers";
    else if (lower.includes("loafer")) subcategory = "Loafers";
    else if (lower.includes("boot")) subcategory = "Boots";
    else if (lower.includes("sandal")) subcategory = "Sandals";
    else if (lower.includes("heel")) subcategory = "Heels";
    else subcategory = "Shoes";
  } else if (/\b(watch|watches|bag|bags|belt|belts|sunglasses|jewelry|jewellery|accessories)\b/i.test(lower)) {
    category = "Accessories";
    if (lower.includes("watch")) subcategory = "Watches";
    else if (lower.includes("bag")) subcategory = "Bags";
    else if (lower.includes("belt")) subcategory = "Belts";
    else if (lower.includes("sunglasses")) subcategory = "Sunglasses";
    else subcategory = "Accessories";
  }

  // Fallback to OP Fashion Taxonomy keywords if still unset
  if (!category) {
    for (const catKey of Object.keys(OP_FASHION_TAXONOMY)) {
      const cat = OP_FASHION_TAXONOMY[catKey];
      for (const kw of cat.keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, "i");
        if (regex.test(lower)) {
          category = cat.name;
          break;
        }
      }
      if (category) break;
    }
  }

  if (!category) {
    category = detectedGender === "Men" ? "Tops" : "Dresses";
    subcategory = category === "Tops" ? "Shirts" : "Dresses";
  }

  // Styles discovery
  const availableStyles = getStylesForCategory(category);
  for (const st of availableStyles) {
    for (const kw of st.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        matchedStyle = st;
        if (!subcategory) subcategory = st.name;
        break;
      }
    }
    if (matchedStyle) break;
  }

  const discoveredStyles: string[] = availableStyles.map((s) => s.name);
  if (subcategory && !discoveredStyles.includes(subcategory)) {
    discoveredStyles.unshift(subcategory);
  }

  // Build clean search keywords
  const searchTerms: string[] = [];
  if (detectedGender && detectedGender !== "All") searchTerms.push(detectedGender);
  if (detectedColor) searchTerms.push(detectedColor);
  if (detectedFit && detectedFit !== "Regular") searchTerms.push(detectedFit);
  if (detectedStyle && (!subcategory || !subcategory.toLowerCase().includes(detectedStyle.toLowerCase()))) {
    searchTerms.push(detectedStyle);
  }
  if (subcategory) {
    searchTerms.push(subcategory);
  } else if (category) {
    searchTerms.push(category);
  }
  if (detectedPattern) searchTerms.push(detectedPattern);

  return {
    rawQuery: query,
    category,
    subcategory,
    style: detectedStyle || (matchedStyle ? matchedStyle.name : subcategory),
    color: detectedColor,
    pattern: detectedPattern,
    fit: detectedFit,
    occasion: detectedOccasion,
    season: detectedSeason,
    gender: detectedGender || "All",
    budget: detectedBudgetMax ? { max: detectedBudgetMax } : undefined,
    comfortPriority,
    discoveredStyles,
    searchKeywords: searchTerms.join(" "),
  };
}

