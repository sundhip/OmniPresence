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
];

const PATTERN_KEYWORDS: Record<string, string> = {
  floral: "Floral",
  flowers: "Floral",
  striped: "Striped",
  stripes: "Striped",
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

  // 2. Budget extraction
  const budgetMatches = lower.match(/(?:under|below|less than|within|budget|rs\.?|₹)\s*(\d{2,6})/i);
  if (budgetMatches && budgetMatches[1]) {
    detectedBudgetMax = parseInt(budgetMatches[1], 10);
  }

  // 3. Color extraction
  for (const c of COLOR_KEYWORDS) {
    const regex = new RegExp(`\\b${c}\\b`, "i");
    if (regex.test(lower)) {
      detectedColor = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // 4. Pattern extraction
  for (const [kw, pat] of Object.entries(PATTERN_KEYWORDS)) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(lower)) {
      detectedPattern = pat;
      break;
    }
  }

  // 5. Occasion extraction
  for (const [kw, occ] of Object.entries(OCCASION_KEYWORDS)) {
    if (lower.includes(kw)) {
      detectedOccasion = occ;
      break;
    }
  }

  // 6. Season extraction
  for (const [kw, sea] of Object.entries(SEASON_KEYWORDS)) {
    if (lower.includes(kw)) {
      detectedSeason = sea;
      break;
    }
  }

  // 7. Comfort extraction
  if (lower.includes("comfort") || lower.includes("breezy") || lower.includes("relaxed") || lower.includes("easy")) {
    comfortPriority = true;
  }

  // 8. Category identification against OP Fashion Taxonomy
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

  // Contextual fallback based on keywords
  if (!category) {
    if (
      lower.includes("dress") ||
      lower.includes("skirt") ||
      lower.includes("gown") ||
      lower.includes("frock")
    ) {
      category = "Dresses";
      if (!detectedGender) detectedGender = "Women";
    } else if (
      lower.includes("shirt") ||
      lower.includes("tee") ||
      lower.includes("top") ||
      lower.includes("polo") ||
      lower.includes("hoodie") ||
      lower.includes("sweatshirt")
    ) {
      category = "Tops";
    } else if (
      lower.includes("jeans") ||
      lower.includes("trouser") ||
      lower.includes("pant") ||
      lower.includes("short") ||
      lower.includes("chino")
    ) {
      category = "Bottoms";
    } else if (
      lower.includes("shoe") ||
      lower.includes("sneaker") ||
      lower.includes("boot") ||
      lower.includes("heel") ||
      lower.includes("loafer")
    ) {
      category = "Footwear";
    } else if (
      lower.includes("blazer") ||
      lower.includes("jacket") ||
      lower.includes("coat")
    ) {
      category = "Outerwear";
    } else {
      category = detectedGender === "Men" ? "Tops" : "Dresses";
    }
  }

  // Find exact style matches within category
  const availableStyles = getStylesForCategory(category);
  for (const st of availableStyles) {
    for (const kw of st.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        matchedStyle = st;
        subcategory = st.name;
        break;
      }
    }
    if (matchedStyle) break;
  }

  // If query mentions "maxi dress" specifically or "shirt"
  if (!subcategory) {
    if (lower.includes("maxi")) subcategory = "Maxi Dress";
    else if (lower.includes("midi")) subcategory = "Midi Dress";
    else if (lower.includes("mini")) subcategory = "Mini Dress";
    else if (lower.includes("bodycon")) subcategory = "Bodycon Dress";
    else if (lower.includes("a-line") || lower.includes("aline")) subcategory = "A-Line Dress";
    else if (lower.includes("floral")) subcategory = "Floral Dress";
    else if (lower.includes("shirt")) subcategory = "Shirt";
    else if (lower.includes("t-shirt") || lower.includes("tshirt")) subcategory = "T-Shirt";
    else if (lower.includes("jeans")) subcategory = "Jeans";
    else if (lower.includes("sneaker")) subcategory = "Sneakers";
  }

  // Discovered style list to show in the UI Style Discovery section
  let discoveredStyles: string[] = [];
  if (detectedOccasion === "Weddings / Functions") {
    discoveredStyles = [
      "Wedding/Occasion Dress",
      "Evening Dress",
      "Party Dress",
      "Ethnic Dress",
      "Maxi Dress",
      "A-Line Dress",
    ];
  } else if (detectedSeason === "Summer" || comfortPriority) {
    discoveredStyles = [
      "Summer Dress",
      "Floral Dress",
      "Casual Dress",
      "Maxi Dress",
      "Wrap Dress",
      "A-Line Dress",
    ];
  } else {
    discoveredStyles = availableStyles.map((s) => s.name);
  }

  // Build clean search keywords for marketplaces with gender prefix
  const searchTerms: string[] = [];
  if (detectedGender && detectedGender !== "All") {
    searchTerms.push(detectedGender);
  }
  if (detectedColor) searchTerms.push(detectedColor);
  if (detectedPattern && (!matchedStyle || !matchedStyle.name.includes(detectedPattern))) {
    searchTerms.push(detectedPattern);
  }
  if (matchedStyle) {
    searchTerms.push(matchedStyle.searchModifier);
  } else if (subcategory) {
    searchTerms.push(subcategory);
  } else if (category) {
    searchTerms.push(category);
  }
  if (detectedOccasion && !matchedStyle) searchTerms.push(detectedOccasion);

  return {
    rawQuery: query,
    category,
    subcategory: subcategory || (matchedStyle ? matchedStyle.name : undefined),
    style: matchedStyle ? matchedStyle.name : (subcategory || undefined),
    color: detectedColor,
    pattern: detectedPattern,
    occasion: detectedOccasion,
    season: detectedSeason,
    gender: detectedGender || "All",
    budget: detectedBudgetMax ? { max: detectedBudgetMax } : undefined,
    comfortPriority,
    discoveredStyles,
    searchKeywords: searchTerms.join(" "),
  };
}
