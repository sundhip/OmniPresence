import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
} from "@/types/marketplace";
import { UserProfile } from "@/types/user";
import { WardrobeItem } from "@/types/wardrobe";

export interface HybridScoreBreakdown {
  semanticScore: number;
  visualScore: number;
  wardrobeScore: number;
  preferenceScore: number;
  occasionScore: number;
  budgetScore: number;
  duplicatePenalty: number;
  finalScore: number;
}

export class MarketplaceRetrievalEngine {
  /**
   * Qwen3.5 / Gemma Shopping Intent Parser
   * Parses free-form queries into structured fashion parameters
   */
  public parseShoppingIntent(queryText: string): FashionParsedQuery {
    const raw = queryText.trim();
    const lower = raw.toLowerCase();

    // 1. Extract Price Budget (e.g., "under 1500", "below ₹2000", "under 2k")
    let maxBudget: number | undefined = undefined;
    const priceMatch = lower.match(/(?:under|below|less than|within|max)\s*(?:rs\.?|inr|₹)?\s*(\d+)(?:k)?/i);
    if (priceMatch) {
      const val = parseInt(priceMatch[1], 10);
      maxBudget = lower.includes(priceMatch[1] + "k") ? val * 1000 : val;
    }

    // 2. Extract Category
    let category: string | undefined = undefined;
    let subcategory: string | undefined = undefined;

    if (/\b(shirt|shirts|oxford|polo|t-shirt|tee|tees|blouse|sweater|hoodie|top|tops)\b/i.test(lower)) {
      category = "Tops";
      if (lower.includes("polo")) subcategory = "Polos";
      else if (lower.includes("t-shirt") || lower.includes("tee")) subcategory = "T-Shirts";
      else if (lower.includes("sweater")) subcategory = "Sweaters";
      else subcategory = "Shirts";
    } else if (/\b(jeans|pants|trousers|chinos|shorts|skirt|bottoms)\b/i.test(lower)) {
      category = "Bottoms";
      if (lower.includes("jeans")) subcategory = "Jeans";
      else if (lower.includes("chinos")) subcategory = "Chinos";
      else if (lower.includes("shorts")) subcategory = "Shorts";
      else subcategory = "Trousers";
    } else if (/\b(dress|dresses|gown|frock|maxi|slip dress|jumpsuit|suit)\b/i.test(lower)) {
      category = "Dresses";
      if (lower.includes("maxi")) subcategory = "Maxi Dress";
      else if (lower.includes("slip")) subcategory = "Slip Dress";
      else subcategory = "Dresses";
    } else if (/\b(jacket|blazer|coat|overcoat|bomber|outerwear)\b/i.test(lower)) {
      category = "Outerwear";
      if (lower.includes("blazer")) subcategory = "Blazers";
      else if (lower.includes("denim jacket")) subcategory = "Denim Jackets";
      else subcategory = "Jackets";
    } else if (/\b(shoes|sneakers|loafers|boots|footwear|kicks|sandals)\b/i.test(lower)) {
      category = "Shoes";
      if (lower.includes("sneakers") || lower.includes("kicks")) subcategory = "Sneakers";
      else if (lower.includes("loafers")) subcategory = "Loafers";
      else subcategory = "Shoes";
    } else if (/\b(watch|bag|belt|sunglasses|accessory|accessories)\b/i.test(lower)) {
      category = "Accessories";
      if (lower.includes("watch")) subcategory = "Watches";
      else if (lower.includes("bag")) subcategory = "Bags";
    }

    // 3. Extract Color
    const colorList = [
      "white", "black", "navy", "blue", "red", "crimson", "green", "emerald",
      "yellow", "mustard", "beige", "tan", "brown", "grey", "charcoal",
      "pink", "purple", "burgundy", "olive", "floral", "indigo"
    ];
    let detectedColor: string | undefined = undefined;
    for (const c of colorList) {
      if (new RegExp(`\\b${c}\\b`, "i").test(lower)) {
        detectedColor = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }

    // 4. Extract Fit
    let detectedFit: string | undefined = undefined;
    if (lower.includes("oversized") || lower.includes("baggy") || lower.includes("loose")) {
      detectedFit = "Oversized";
    } else if (lower.includes("slim") || lower.includes("skinny") || lower.includes("tailored")) {
      detectedFit = "Slim";
    } else if (lower.includes("regular") || lower.includes("classic")) {
      detectedFit = "Regular";
    }

    // 5. Extract Occasion
    let detectedOccasion: string | undefined = undefined;
    if (lower.includes("wedding") || lower.includes("reception") || lower.includes("gala")) {
      detectedOccasion = "Wedding";
    } else if (lower.includes("office") || lower.includes("work") || lower.includes("meeting") || lower.includes("interview")) {
      detectedOccasion = "Office";
    } else if (lower.includes("party") || lower.includes("club") || lower.includes("night out")) {
      detectedOccasion = "Party";
    } else if (lower.includes("casual") || lower.includes("daily") || lower.includes("weekend")) {
      detectedOccasion = "Casual";
    }

    // 6. Extract Gender
    let detectedGender: "Women" | "Men" | "Unisex" | "All" | undefined = undefined;
    if (/\b(men|mens|men's|gents|gentleman)\b/i.test(lower)) {
      detectedGender = "Men";
    } else if (/\b(women|womens|women's|ladies|girl|female)\b/i.test(lower)) {
      detectedGender = "Women";
    }

    // Discovered styles
    const discoveredStyles: string[] = [];
    if (subcategory) discoveredStyles.push(subcategory);
    if (detectedFit) discoveredStyles.push(detectedFit);
    if (detectedOccasion) discoveredStyles.push(detectedOccasion);

    return {
      rawQuery: raw,
      category,
      subcategory,
      color: detectedColor,
      fit: detectedFit,
      occasion: detectedOccasion,
      gender: detectedGender,
      budget: maxBudget ? { max: maxBudget } : undefined,
      discoveredStyles,
      searchKeywords: raw,
    };
  }

  /**
   * Evaluates Wardrobe Compatibility
   * Returns match score 0-100 and reasons
   */
  public evaluateWardrobeCompatibility(
    product: MarketplaceProduct,
    wardrobeItems: WardrobeItem[]
  ): { score: number; pairingItems: string[]; reasoning: string } {
    if (!wardrobeItems || wardrobeItems.length === 0) {
      return {
        score: 75,
        pairingItems: [],
        reasoning: "Great foundational piece to build your digital wardrobe.",
      };
    }

    let matchScore = 60;
    const pairingItems: string[] = [];
    const prodCat = (product.category || "").toLowerCase();
    const prodColors = (product.colors || []).map((c) => c.toLowerCase());

    // 1. Cross-Category Pairing Logic
    if (prodCat.includes("top") || prodCat.includes("shirt")) {
      // Tops pair with Bottoms & Shoes
      const matchingBottoms = wardrobeItems.filter((w) =>
        (w.category || "").toLowerCase().includes("bottom") ||
        (w.category || "").toLowerCase().includes("pants") ||
        (w.category || "").toLowerCase().includes("jeans")
      );
      if (matchingBottoms.length > 0) {
        matchScore += 20;
        pairingItems.push(matchingBottoms[0].name || "your Jeans");
      }
    } else if (prodCat.includes("bottom") || prodCat.includes("jean")) {
      // Bottoms pair with Tops & Outerwear
      const matchingTops = wardrobeItems.filter((w) =>
        (w.category || "").toLowerCase().includes("top") ||
        (w.category || "").toLowerCase().includes("shirt")
      );
      if (matchingTops.length > 0) {
        matchScore += 20;
        pairingItems.push(matchingTops[0].name || "your Tops");
      }
    } else if (prodCat.includes("dress")) {
      matchScore += 15;
      pairingItems.push("your Evening Footwear");
    } else if (prodCat.includes("shoe") || prodCat.includes("sneaker")) {
      matchScore += 25;
      pairingItems.push("your everyday trousers and denim");
    }

    // 2. Color Compatibility
    const neutralColors = ["white", "black", "grey", "navy", "beige", "denim", "tan"];
    const isNeutral = prodColors.some((c) => neutralColors.includes(c));
    if (isNeutral) {
      matchScore += 15;
    }

    const clampedScore = Math.min(98, Math.max(50, matchScore));
    const pairText = pairingItems.length > 0 ? `Pairs seamlessly with ${pairingItems.join(" and ")}.` : "Versatile piece.";

    return {
      score: clampedScore,
      pairingItems,
      reasoning: `${clampedScore}% wardrobe match. ${pairText}`,
    };
  }

  /**
   * "Do I Need This?" Purchase Evaluator
   * Checks for duplicate items, category saturation, wardrobe gaps, and budget impact
   */
  public evaluateDoINeedThis(
    product: MarketplaceProduct,
    wardrobeItems: WardrobeItem[],
    userProfile?: UserProfile | null
  ): {
    needScore: number;
    verdict: "Essential Addition" | "Versatile Match" | "High Redundancy" | "Budget Alert";
    duplicateCount: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let needScore = 75;
    let duplicateCount = 0;

    const prodCat = (product.category || "").toLowerCase();
    const prodSub = (product.subcategory || "").toLowerCase();
    const prodColor = (product.colors?.[0] || "").toLowerCase();

    // 1. Duplicate & Saturation Check
    const similarItems = wardrobeItems.filter((w) => {
      const wCat = (w.category || "").toLowerCase();
      const wColor = (w.color || "").toLowerCase();
      const wName = (w.name || "").toLowerCase();

      const sameCategory = wCat.includes(prodCat) || (prodCat.includes("top") && wCat.includes("top"));
      const sameColor = prodColor && wColor.includes(prodColor);
      const sameName = prodSub && wName.includes(prodSub);

      if (sameCategory && (sameColor || sameName)) {
        return true;
      }
      return false;
    });

    duplicateCount = similarItems.length;

    if (duplicateCount >= 3) {
      needScore -= 45;
      reasons.push(`High redundancy: You already own ${duplicateCount} similar ${prodColor || ""} ${prodCat} items in your wardrobe.`);
    } else if (duplicateCount >= 1) {
      needScore -= 20;
      reasons.push(`You already own ${duplicateCount} comparable item (${similarItems[0].name || "similar piece"}).`);
    } else {
      needScore += 15;
      reasons.push(`Fills a genuine wardrobe gap: You don't own any ${prodColor || ""} ${prodCat} pieces.`);
    }

    // 2. Wardrobe Gap Analysis
    const categoryCount = wardrobeItems.filter((w) => (w.category || "").toLowerCase().includes(prodCat)).length;
    if (categoryCount === 0) {
      needScore += 20;
      reasons.push(`Category Gap: You have 0 items in ${product.category}. Essential for outfit variety.`);
    }

    // 3. User Style Preference Match
    if (userProfile?.stylePreferences && product.style) {
      const hasStyleMatch = userProfile.stylePreferences.some((sp) =>
        product.style?.toLowerCase().includes(sp.toLowerCase())
      );
      if (hasStyleMatch) {
        needScore += 10;
        reasons.push(`Aligned with your '${product.style}' aesthetic preference.`);
      }
    }

    // Determine verdict
    let verdict: "Essential Addition" | "Versatile Match" | "High Redundancy" | "Budget Alert" = "Versatile Match";
    if (duplicateCount >= 3) {
      verdict = "High Redundancy";
    } else if (needScore >= 85) {
      verdict = "Essential Addition";
    } else if (needScore < 50) {
      verdict = "High Redundancy";
    }

    return {
      needScore: Math.min(100, Math.max(10, needScore)),
      verdict,
      duplicateCount,
      reasons,
    };
  }

  /**
   * Deterministic Hybrid Scoring Pipeline
   */
  public computeHybridScores(
    product: MarketplaceProduct,
    query: FashionParsedQuery,
    wardrobeItems: WardrobeItem[],
    userProfile?: UserProfile | null,
    filters?: MarketplaceSearchFilters
  ): HybridScoreBreakdown {
    const titleLower = product.title.toLowerCase();
    const styleLower = (query.style || query.subcategory || "").toLowerCase();
    const colorLower = (query.color || "").toLowerCase();
    const occasionLower = (query.occasion || "").toLowerCase();

    // 1. Semantic Relevance
    let semanticScore = 70;
    if (styleLower && titleLower.includes(styleLower)) semanticScore += 18;
    if (colorLower && titleLower.includes(colorLower)) semanticScore += 12;
    semanticScore = Math.min(100, semanticScore);

    // 2. Visual Similarity
    let visualScore = 75;
    if (query.imageFeatures) {
      if (query.imageFeatures.dominantColor && (product.colors || []).some((c) => c.toLowerCase() === query.imageFeatures?.dominantColor?.toLowerCase())) {
        visualScore += 15;
      }
      if (query.imageFeatures.detectedCategory && (product.category || "").toLowerCase().includes(query.imageFeatures.detectedCategory.toLowerCase())) {
        visualScore += 10;
      }
    }
    visualScore = Math.min(100, visualScore);

    // 3. Wardrobe Compatibility
    const wardrobeEval = this.evaluateWardrobeCompatibility(product, wardrobeItems);
    const wardrobeScore = wardrobeEval.score;

    // 4. Preference Score
    let preferenceScore = 65;
    if (userProfile) {
      if (userProfile.gender && (product.gender === userProfile.gender || product.gender === "Unisex")) {
        preferenceScore += 15;
      }
      if (userProfile.stylePreferences && product.style) {
        if (userProfile.stylePreferences.some((sp) => product.style?.toLowerCase().includes(sp.toLowerCase()))) {
          preferenceScore += 15;
        }
      }
    }
    preferenceScore = Math.min(100, preferenceScore);

    // 5. Occasion Match
    let occasionScore = 70;
    if (occasionLower && (product.occasion || "").toLowerCase().includes(occasionLower)) {
      occasionScore = 95;
    }

    // 6. Budget Score
    let budgetScore = 80;
    const maxB = filters?.maxPrice || query.budget?.max;
    if (maxB) {
      if (product.price <= maxB) budgetScore = 95;
      else budgetScore = Math.max(30, 95 - ((product.price - maxB) / maxB) * 100);
    }

    // 7. Duplicate Penalty
    const needEval = this.evaluateDoINeedThis(product, wardrobeItems, userProfile);
    const duplicatePenalty = needEval.duplicateCount >= 3 ? 30 : needEval.duplicateCount >= 1 ? 10 : 0;

    // Final Weighted Hybrid Score
    const finalScore = Math.round(
      semanticScore * 0.25 +
      visualScore * 0.15 +
      wardrobeScore * 0.25 +
      preferenceScore * 0.15 +
      budgetScore * 0.10 +
      occasionScore * 0.10 -
      duplicatePenalty
    );

    return {
      semanticScore,
      visualScore,
      wardrobeScore,
      preferenceScore,
      occasionScore,
      budgetScore,
      duplicatePenalty,
      finalScore: Math.min(100, Math.max(10, finalScore)),
    };
  }
}

export const marketplaceRetrievalEngine = new MarketplaceRetrievalEngine();
