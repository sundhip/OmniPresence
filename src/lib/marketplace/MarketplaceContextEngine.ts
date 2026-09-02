import { UserProfile, SkinToneInfo } from "@/types/user";
import { WardrobeItem } from "@/types/wardrobe";
import { EventItem } from "@/types/events";
import { MarketplaceProduct, FashionParsedQuery } from "@/types/marketplace";

export interface WeatherContextData {
  temp?: number;
  condition?: string;
  isRainy?: boolean;
  isHot?: boolean;
  isCold?: boolean;
}

export interface UserContextSnapshot {
  userProfile?: UserProfile | null;
  wardrobeItems?: WardrobeItem[];
  upcomingEvents?: EventItem[];
  weather?: WeatherContextData | null;
}

export class MarketplaceContextEngine {
  /**
   * Evaluates color harmony with the user's skin tone and undertone
   */
  public evaluateSkinToneHarmony(
    product: MarketplaceProduct,
    skinTone?: SkinToneInfo
  ): { score: number; reason?: string } {
    if (!skinTone || !product.colors || product.colors.length === 0) {
      return { score: 75 };
    }

    const undertone = skinTone.undertone;
    const prodColors = product.colors.map((c) => c.toLowerCase());

    // Warm undertones flatter earthy, golden, warm reds, olive, mustard, beige, warm brown
    const warmPalette = ["mustard", "olive", "beige", "tan", "brown", "maroon", "orange", "gold", "rust", "cream", "coral", "burgundy"];
    // Cool undertones flatter jewel tones, crisp white, navy, emerald, royal blue, charcoal, pink, lavender
    const coolPalette = ["navy", "emerald", "blue", "charcoal", "white", "black", "pink", "lavender", "silver", "purple", "cyan", "teal"];
    // Neutral undertones flatter almost everything, especially pastels and monochrome
    const neutralPalette = ["black", "white", "grey", "navy", "beige", "olive", "burgundy", "pink", "tan"];

    let matches = 0;
    if (undertone === "Warm") {
      matches = prodColors.filter((c) => warmPalette.some((w) => c.includes(w))).length;
    } else if (undertone === "Cool") {
      matches = prodColors.filter((c) => coolPalette.some((cp) => c.includes(cp))).length;
    } else {
      matches = prodColors.filter((c) => neutralPalette.some((np) => c.includes(np))).length;
    }

    if (matches > 0) {
      return {
        score: 95,
        reason: `Flattering color match for your ${undertone.toLowerCase()} skin undertone (${skinTone.name}).`,
      };
    }

    return { score: 75 };
  }

  /**
   * Evaluates relevance to upcoming calendar events (e.g. Wedding, Interview, Party)
   */
  public evaluateEventRelevance(
    product: MarketplaceProduct,
    upcomingEvents?: EventItem[]
  ): { score: number; matchedEvent?: EventItem; reason?: string } {
    if (!upcomingEvents || upcomingEvents.length === 0) {
      return { score: 70 };
    }

    const now = new Date();
    // Look at events within next 30 days
    const upcoming = upcomingEvents.filter((e) => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= -1 && diffDays <= 30;
    });

    if (upcoming.length === 0) {
      return { score: 70 };
    }

    const prodTitle = product.title.toLowerCase();
    const prodCat = (product.category || "").toLowerCase();
    const prodOccasion = (product.occasion || "").toLowerCase();

    for (const evt of upcoming) {
      const evtTitle = (evt.title || "").toLowerCase();
      const evtType = (evt.type || "").toLowerCase();
      const evtDress = (evt.dressCode || "").toLowerCase();

      // Wedding / Festive Event
      if (
        evtTitle.includes("wedding") ||
        evtTitle.includes("reception") ||
        evtTitle.includes("marriage") ||
        evtTitle.includes("sangeet") ||
        evtType.includes("wedding") ||
        evtDress.includes("festive") ||
        evtDress.includes("traditional")
      ) {
        if (
          prodCat.includes("ethnic") ||
          prodTitle.includes("kurta") ||
          prodTitle.includes("saree") ||
          prodTitle.includes("lehenga") ||
          prodTitle.includes("sherwani") ||
          prodTitle.includes("blazer") ||
          prodTitle.includes("dress") ||
          prodOccasion.includes("wedding")
        ) {
          return {
            score: 98,
            matchedEvent: evt,
            reason: `Perfect for your upcoming event "${evt.title}".`,
          };
        }
      }

      // Office / Meeting / Interview
      if (
        evtTitle.includes("interview") ||
        evtTitle.includes("meeting") ||
        evtTitle.includes("presentation") ||
        evtTitle.includes("conference") ||
        evtType.includes("office") ||
        evtType.includes("business")
      ) {
        if (
          prodTitle.includes("formal") ||
          prodTitle.includes("shirt") ||
          prodTitle.includes("trousers") ||
          prodTitle.includes("chinos") ||
          prodTitle.includes("blazer") ||
          prodTitle.includes("loafers")
        ) {
          return {
            score: 95,
            matchedEvent: evt,
            reason: `Great professional match for "${evt.title}".`,
          };
        }
      }

      // Party / Celebration
      if (
        evtTitle.includes("party") ||
        evtTitle.includes("birthday") ||
        evtTitle.includes("anniversary") ||
        evtTitle.includes("dinner") ||
        evtType.includes("party")
      ) {
        if (
          prodTitle.includes("dress") ||
          prodTitle.includes("jacket") ||
          prodTitle.includes("smart") ||
          prodOccasion.includes("party")
        ) {
          return {
            score: 94,
            matchedEvent: evt,
            reason: `Stylish choice for your upcoming "${evt.title}".`,
          };
        }
      }
    }

    return { score: 70 };
  }

  /**
   * Evaluates relevance to local weather forecast
   */
  public evaluateWeatherRelevance(
    product: MarketplaceProduct,
    weather?: WeatherContextData | null
  ): { score: number; reason?: string } {
    if (!weather || weather.temp === undefined) {
      return { score: 75 };
    }

    const prodTitle = product.title.toLowerCase();
    const prodCat = (product.category || "").toLowerCase();
    const temp = weather.temp;

    // Hot Weather (>= 28°C)
    if (temp >= 28 || weather.isHot) {
      if (
        prodTitle.includes("linen") ||
        prodTitle.includes("cotton") ||
        prodTitle.includes("short") ||
        prodTitle.includes("sundress") ||
        prodTitle.includes("breathable") ||
        prodTitle.includes("t-shirt") ||
        prodTitle.includes("tee")
      ) {
        return {
          score: 95,
          reason: `Lightweight and breathable for current warm weather (${Math.round(temp)}°C).`,
        };
      }
      if (prodTitle.includes("wool") || prodTitle.includes("fleece") || prodTitle.includes("sweater") || prodTitle.includes("heavy")) {
        return { score: 40 };
      }
    }

    // Cold Weather (<= 18°C)
    if (temp <= 18 || weather.isCold) {
      if (
        prodTitle.includes("hoodie") ||
        prodTitle.includes("sweater") ||
        prodTitle.includes("jacket") ||
        prodTitle.includes("coat") ||
        prodTitle.includes("fleece") ||
        prodTitle.includes("wool") ||
        prodCat.includes("outerwear")
      ) {
        return {
          score: 96,
          reason: `Cozy layering essential for cool weather (${Math.round(temp)}°C).`,
        };
      }
    }

    return { score: 75 };
  }

  /**
   * Automatically synthesizes shopping intent ("Picked for You") when user opens Marketplace without searching
   */
  public generateAutomaticShoppingIntent(
    userProfile?: UserProfile | null,
    wardrobeItems?: WardrobeItem[],
    upcomingEvents?: EventItem[],
    weather?: WeatherContextData | null
  ): FashionParsedQuery {
    const gender = userProfile?.gender || "All";
    const stylePref = userProfile?.stylePreferences?.[0] || "Casual";
    const fitPref = userProfile?.fitPreferences?.[0] || userProfile?.fitPreference || "Regular";
    const colorPref = userProfile?.colorPreferences?.[0] || "";

    // 1. Check if there is an imminent high-priority calendar event
    const now = new Date();
    const upcomingHighPriority = (upcomingEvents || []).find((e) => {
      if (!e.date) return false;
      const diffDays = (new Date(e.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 14;
    });

    if (upcomingHighPriority) {
      const evtTitle = upcomingHighPriority.title.toLowerCase();
      if (evtTitle.includes("wedding") || evtTitle.includes("reception") || evtTitle.includes("sangeet")) {
        const queryTerm = gender === "Men" ? "Kurta Set" : "Festive Dress";
        return {
          rawQuery: queryTerm,
          category: gender === "Men" ? "Ethnic Wear" : "Dresses",
          subcategory: queryTerm,
          style: "Traditional",
          occasion: "Weddings / Functions",
          gender,
          discoveredStyles: ["Ethnic Wear", "Kurta", "Festive Dress", "Formal Suit"],
          searchKeywords: `${gender !== "All" ? gender : ""} ${queryTerm}`.trim(),
        };
      }
      if (evtTitle.includes("interview") || evtTitle.includes("conference") || evtTitle.includes("meeting")) {
        const queryTerm = gender === "Men" ? "Formal Shirt" : "Formal Blazer";
        return {
          rawQuery: queryTerm,
          category: gender === "Men" ? "Tops" : "Outerwear",
          subcategory: queryTerm,
          style: "Formal",
          occasion: "Office",
          gender,
          discoveredStyles: ["Formal Shirt", "Tailored Trousers", "Structured Blazer"],
          searchKeywords: `${gender !== "All" ? gender : ""} ${queryTerm}`.trim(),
        };
      }
    }

    // 2. Weather-driven default intent
    if (weather?.temp && weather.temp >= 28) {
      const queryTerm = gender === "Men" ? "Linen Shirt" : "Summer Floral Dress";
      return {
        rawQuery: queryTerm,
        category: gender === "Men" ? "Tops" : "Dresses",
        subcategory: queryTerm,
        style: stylePref,
        fit: fitPref,
        color: colorPref || undefined,
        season: "Summer",
        gender,
        discoveredStyles: ["Linen Shirt", "Cotton T-Shirt", "Summer Dress", "Casual Shorts"],
        searchKeywords: `${gender !== "All" ? gender : ""} ${fitPref !== "Regular" ? fitPref : ""} ${colorPref} ${queryTerm}`.trim(),
      };
    }

    // 3. User Style & Wardrobe preference intent
    let targetSubcategory = "Linen Shirt";
    let targetCategory = "Tops";

    if (gender === "Men") {
      if (stylePref.toLowerCase().includes("street") || fitPref.toLowerCase().includes("oversized")) {
        targetSubcategory = "Oversized T-Shirt";
        targetCategory = "Tops";
      } else if (stylePref.toLowerCase().includes("formal")) {
        targetSubcategory = "Formal Oxford Shirt";
        targetCategory = "Tops";
      } else {
        targetSubcategory = "Casual Shirt";
        targetCategory = "Tops";
      }
    } else {
      if (stylePref.toLowerCase().includes("formal")) {
        targetSubcategory = "Tailored Blazer";
        targetCategory = "Outerwear";
      } else {
        targetSubcategory = "Midi Dress";
        targetCategory = "Dresses";
      }
    }

    const searchWords = [
      gender !== "All" ? gender : "",
      fitPref && fitPref !== "Regular" ? fitPref : "",
      colorPref || "",
      targetSubcategory,
    ].filter(Boolean).join(" ");

    return {
      rawQuery: targetSubcategory,
      category: targetCategory,
      subcategory: targetSubcategory,
      style: stylePref,
      fit: fitPref,
      color: colorPref || undefined,
      gender,
      discoveredStyles: [targetSubcategory, "Chinos", "Denim Jeans", "Sneakers"],
      searchKeywords: searchWords,
    };
  }
}

export const marketplaceContextEngine = new MarketplaceContextEngine();
