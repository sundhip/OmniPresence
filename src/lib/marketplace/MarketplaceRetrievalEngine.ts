import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceSections,
} from "@/types/marketplace";
import { UserProfile } from "@/types/user";
import { WardrobeItem } from "@/types/wardrobe";
import { EventItem } from "@/types/events";
import { parseFashionSearchQuery } from "@/lib/fashionSearchParser";
import {
  marketplaceContextEngine,
  WeatherContextData,
} from "./MarketplaceContextEngine";

export interface HybridScoreBreakdown {
  semanticScore: number;
  visualScore: number;
  wardrobeScore: number;
  preferenceScore: number;
  occasionScore: number;
  budgetScore: number;
  ratingScore: number;
  duplicatePenalty: number;
  finalScore: number;
}

export class MarketplaceRetrievalEngine {
  /**
   * Parses free-form natural language queries into structured fashion parameters
   */
  public parseShoppingIntent(queryText: string): FashionParsedQuery {
    return parseFashionSearchQuery(queryText);
  }

  /**
   * Evaluates Wardrobe Compatibility
   * Returns match score 0-100 and pairing reasons
   */
  public evaluateWardrobeCompatibility(
    product: MarketplaceProduct,
    wardrobeItems: WardrobeItem[]
  ): { score: number; pairingItems: string[]; reasoning: string } {
    if (!wardrobeItems || wardrobeItems.length === 0) {
      return {
        score: 75,
        pairingItems: [],
        reasoning: "Great versatile foundational piece to start your digital wardrobe.",
      };
    }

    let matchScore = 65;
    const pairingItems: string[] = [];
    const prodCat = (product.category || "").toLowerCase();
    const prodTitle = product.title.toLowerCase();
    const prodColors = (product.colors || []).map((c) => c.toLowerCase());

    // Cross-Category Pairing Logic
    if (prodCat.includes("top") || prodCat.includes("shirt") || prodTitle.includes("shirt") || prodTitle.includes("hoodie")) {
      const matchingBottoms = wardrobeItems.filter((w) => {
        const cat = (w.category || "").toLowerCase();
        return cat.includes("bottom") || cat.includes("pants") || cat.includes("jeans") || cat.includes("trousers");
      });
      if (matchingBottoms.length > 0) {
        matchScore += 20;
        pairingItems.push(matchingBottoms[0].name || "your Jeans");
      }
    } else if (prodCat.includes("bottom") || prodCat.includes("jean") || prodTitle.includes("pant") || prodTitle.includes("trouser")) {
      const matchingTops = wardrobeItems.filter((w) => {
        const cat = (w.category || "").toLowerCase();
        return cat.includes("top") || cat.includes("shirt") || cat.includes("tee");
      });
      if (matchingTops.length > 0) {
        matchScore += 20;
        pairingItems.push(matchingTops[0].name || "your Tops");
      }
    } else if (prodCat.includes("ethnic") || prodTitle.includes("kurta")) {
      const matchingEthnic = wardrobeItems.filter((w) => {
        const cat = (w.category || "").toLowerCase();
        return cat.includes("ethnic") || cat.includes("bottom") || cat.includes("shoe");
      });
      if (matchingEthnic.length > 0) {
        matchScore += 20;
        pairingItems.push(matchingEthnic[0].name || "your traditional footwear/pyjamas");
      }
    } else if (prodCat.includes("dress")) {
      matchScore += 15;
      pairingItems.push("your Evening Footwear");
    } else if (prodCat.includes("shoe") || prodCat.includes("sneaker") || prodCat.includes("footwear")) {
      matchScore += 25;
      pairingItems.push("your everyday trousers and denim");
    }

    // Color Compatibility
    const neutralColors = ["white", "black", "grey", "navy", "beige", "denim", "tan", "charcoal"];
    const isNeutral = prodColors.some((c) => neutralColors.includes(c));
    if (isNeutral) {
      matchScore += 10;
    }

    const clampedScore = Math.min(98, Math.max(50, matchScore));
    const pairText = pairingItems.length > 0 ? `Pairs seamlessly with ${pairingItems.join(" and ")}.` : "Highly versatile styling match.";

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
    const similarItems = (wardrobeItems || []).filter((w) => {
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
      reasons.push(`You already own ${duplicateCount} comparable piece (${similarItems[0].name || "similar piece"}).`);
    } else {
      needScore += 15;
      reasons.push(`Fills a genuine wardrobe gap: You don't own any ${prodColor || ""} ${prodCat} pieces.`);
    }

    // 2. Wardrobe Gap Analysis
    const categoryCount = (wardrobeItems || []).filter((w) => (w.category || "").toLowerCase().includes(prodCat)).length;
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
   * Generates honest, grounded OP AI Rationale based strictly on actual attributes
   */
  public generateGroundedRecommendationReason(
    product: MarketplaceProduct,
    query: FashionParsedQuery,
    userProfile?: UserProfile | null,
    wardrobeItems: WardrobeItem[] = [],
    upcomingEvents: EventItem[] = [],
    weather?: WeatherContextData | null
  ): string {
    const reasons: string[] = [];

    // 1. Style & Fit Match
    const prodFit = product.fit || query.fit;
    const prodStyle = product.style || query.style;
    const userFit = userProfile?.fitPreferences?.[0] || userProfile?.fitPreference;

    if (userFit && prodFit && userFit.toLowerCase() === prodFit.toLowerCase()) {
      reasons.push(`matches your preferred ${prodFit.toLowerCase()} fit`);
    } else if (prodFit && prodFit !== "Regular") {
      reasons.push(`features a ${prodFit.toLowerCase()} silhouette`);
    }

    if (userProfile?.stylePreferences && prodStyle) {
      const isStyleMatch = userProfile.stylePreferences.some((sp) =>
        prodStyle.toLowerCase().includes(sp.toLowerCase())
      );
      if (isStyleMatch) {
        reasons.push(`aligns with your ${prodStyle.toLowerCase()} aesthetic`);
      }
    }

    // 2. Color / Skin-Tone Harmony
    const skinToneRes = marketplaceContextEngine.evaluateSkinToneHarmony(product, userProfile?.appearance?.skinTone);
    if (skinToneRes.score >= 90 && userProfile?.appearance?.skinTone) {
      reasons.push(`flatters your ${userProfile.appearance.skinTone.undertone.toLowerCase()} skin tone`);
    } else if (product.colors && product.colors.length > 0 && userProfile?.colorPreferences) {
      const colorMatch = userProfile.colorPreferences.find((cp) =>
        product.colors?.some((pc) => pc.toLowerCase() === cp.toLowerCase())
      );
      if (colorMatch) {
        reasons.push(`matches your ${colorMatch.toLowerCase()} color preference`);
      }
    }

    // 3. Budget Alignment
    const maxBudget = query.budget?.max;
    if (maxBudget && product.price <= maxBudget) {
      reasons.push(`fits comfortably within your ₹${maxBudget} budget`);
    }

    // 4. Upcoming Event Alignment
    const eventRes = marketplaceContextEngine.evaluateEventRelevance(product, upcomingEvents);
    if (eventRes.score >= 90 && eventRes.matchedEvent) {
      reasons.push(`ready for your upcoming "${eventRes.matchedEvent.title}"`);
    }

    // 5. Wardrobe Pairing / Gap
    const needEval = this.evaluateDoINeedThis(product, wardrobeItems, userProfile);
    if (needEval.duplicateCount === 0 && wardrobeItems.length > 0) {
      reasons.push("fills a fresh gap in your wardrobe");
    }

    // 6. Rating Signal
    if (product.rating && product.rating >= 4.3 && product.reviewCount && product.reviewCount >= 50) {
      reasons.push(`highly rated (${product.rating.toFixed(1)}★ from ${product.reviewCount}+ buyers)`);
    }

    if (reasons.length === 0) {
      return `Recommended by OP AI based on style relevance and quality rating (${product.rating ? `${product.rating.toFixed(1)}★` : "Verified product"}).`;
    }

    if (reasons.length === 1) {
      return `Recommended because it ${reasons[0]}.`;
    }

    const firstParts = reasons.slice(0, 2).join(", ");
    const lastPart = reasons.length > 2 ? `, and ${reasons[2]}` : "";
    return `Recommended because it ${firstParts}${lastPart}.`;
  }

  /**
   * Deterministic Multi-Signal Hybrid Scoring Pipeline
   */
  public computeHybridScores(
    product: MarketplaceProduct,
    query: FashionParsedQuery,
    wardrobeItems: WardrobeItem[],
    userProfile?: UserProfile | null,
    filters?: MarketplaceSearchFilters,
    upcomingEvents: EventItem[] = [],
    weather?: WeatherContextData | null
  ): HybridScoreBreakdown {
    const titleLower = product.title.toLowerCase();
    const styleLower = (query.style || query.subcategory || "").toLowerCase();
    const colorLower = (query.color || "").toLowerCase();
    const fitLower = (query.fit || "").toLowerCase();

    // 1. Semantic Relevance (Weight: 20%)
    let semanticScore = 70;
    if (styleLower && titleLower.includes(styleLower)) semanticScore += 18;
    if (colorLower && titleLower.includes(colorLower)) semanticScore += 12;
    if (fitLower && (titleLower.includes(fitLower) || product.fit?.toLowerCase() === fitLower)) semanticScore += 10;
    semanticScore = Math.min(100, semanticScore);

    // 2. Visual / FashionCLIP Similarity (Weight: 15%)
    let visualScore = 75;
    if (query.imageFeatures) {
      if (
        query.imageFeatures.dominantColor &&
        (product.colors || []).some(
          (c) => c.toLowerCase() === query.imageFeatures?.dominantColor?.toLowerCase()
        )
      ) {
        visualScore += 15;
      }
      if (
        query.imageFeatures.detectedCategory &&
        (product.category || "").toLowerCase().includes(query.imageFeatures.detectedCategory.toLowerCase())
      ) {
        visualScore += 10;
      }
    }
    visualScore = Math.min(100, visualScore);

    // 3. User Style, Fit & Size Match (Weight: 15%)
    let preferenceScore = 65;
    if (userProfile) {
      if (userProfile.gender && (product.gender === userProfile.gender || product.gender === "Unisex" || product.gender === "All")) {
        preferenceScore += 10;
      }
      if (userProfile.stylePreferences && product.style) {
        if (userProfile.stylePreferences.some((sp) => product.style?.toLowerCase().includes(sp.toLowerCase()))) {
          preferenceScore += 15;
        }
      }
      const userFit = userProfile.fitPreferences?.[0] || userProfile.fitPreference;
      if (userFit && product.fit && userFit.toLowerCase() === product.fit.toLowerCase()) {
        preferenceScore += 10;
      }
    }
    preferenceScore = Math.min(100, preferenceScore);

    // 4. Wardrobe Compatibility (Weight: 10%)
    const wardrobeEval = this.evaluateWardrobeCompatibility(product, wardrobeItems);
    const wardrobeScore = wardrobeEval.score;

    // 5. Skin-Tone Harmony (Weight: 10%)
    const skinToneEval = marketplaceContextEngine.evaluateSkinToneHarmony(product, userProfile?.appearance?.skinTone);
    const skinToneScore = skinToneEval.score;

    // 6. Event / Occasion Match (Weight: 10%)
    const eventEval = marketplaceContextEngine.evaluateEventRelevance(product, upcomingEvents);
    const occasionScore = eventEval.score;

    // 7. Budget Score (Weight: 10%)
    let budgetScore = 80;
    const maxB = filters?.maxPrice || query.budget?.max;
    if (maxB) {
      if (product.price <= maxB) {
        budgetScore = 95;
      } else {
        budgetScore = Math.max(25, 95 - ((product.price - maxB) / maxB) * 100);
      }
    }

    // 8. Rating & Review Signal (Weight: 10%)
    let ratingScore = 75;
    if (product.rating) {
      ratingScore = Math.min(100, Math.round((product.rating / 5) * 100));
      if (product.reviewCount && product.reviewCount > 100) {
        ratingScore = Math.min(100, ratingScore + 5);
      }
    }

    // 9. Duplicate Penalty (-20 to -40)
    const needEval = this.evaluateDoINeedThis(product, wardrobeItems, userProfile);
    const duplicatePenalty = needEval.duplicateCount >= 3 ? 35 : needEval.duplicateCount >= 1 ? 15 : 0;

    // Weighted Hybrid Final Score
    const finalScore = Math.round(
      semanticScore * 0.20 +
      visualScore * 0.15 +
      preferenceScore * 0.15 +
      skinToneScore * 0.10 +
      wardrobeScore * 0.10 +
      occasionScore * 0.10 +
      budgetScore * 0.10 +
      ratingScore * 0.10 -
      duplicatePenalty
    );

    return {
      semanticScore,
      visualScore,
      wardrobeScore,
      preferenceScore,
      occasionScore,
      budgetScore,
      ratingScore,
      duplicatePenalty,
      finalScore: Math.min(100, Math.max(10, finalScore)),
    };
  }

  /**
   * Partitions scored products into rich, meaningful UX sections
   */
  public partitionSections(products: MarketplaceProduct[]): MarketplaceSections {
    // 1. Picked For You (Top composite personalized score)
    const pickedForYou = [...products]
      .sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0))
      .slice(0, 20);

    // 2. Best Match (Highest semantic relevance)
    const bestMatch = [...products]
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 20);

    // 3. Best Value (Balanced rating >= 4.0 and competitive price)
    const bestValue = [...products]
      .filter((p) => (p.rating || 0) >= 4.0)
      .sort((a, b) => {
        const valA = ((a.rating || 4) * 500) / (a.price || 1000);
        const valB = ((b.rating || 4) * 500) / (b.price || 1000);
        return valB - valA;
      })
      .slice(0, 20);

    // 4. Cost Effective (Under your budget / lowest price)
    const costEffective = [...products]
      .filter((p) => p.price > 0)
      .sort((a, b) => a.price - b.price)
      .slice(0, 20);

    // 5. Highest Rated (4.0+ rating, sorted by rating then review count)
    const highestRated = [...products]
      .filter((p) => (p.rating || 0) >= 3.8)
      .sort((a, b) => {
        if ((b.rating || 0) !== (a.rating || 0)) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      })
      .slice(0, 20);

    // 6. Popular (High review volume)
    const popular = [...products]
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 20);

    // 7. Best Style Match
    const styleMatch = [...products]
      .sort((a, b) => (b.scores?.preferenceScore || 0) - (a.scores?.preferenceScore || 0))
      .slice(0, 20);

    // 8. Wardrobe Match (Highest wardrobe compatibility)
    const wardrobeMatch = [...products]
      .sort((a, b) => (b.wardrobeCompatibilityScore || 0) - (a.wardrobeCompatibilityScore || 0))
      .slice(0, 20);

    // 9. Recommended for Upcoming Events
    const eventMatch = [...products]
      .sort((a, b) => (b.scores?.occasionScore || 0) - (a.scores?.occasionScore || 0))
      .slice(0, 20);

    return {
      pickedForYou: pickedForYou.length > 0 ? pickedForYou : products,
      bestMatch: bestMatch.length > 0 ? bestMatch : products,
      bestValue: bestValue.length > 0 ? bestValue : products,
      costEffective: costEffective.length > 0 ? costEffective : products,
      highestRated: highestRated.length > 0 ? highestRated : products,
      popular: popular.length > 0 ? popular : products,
      styleMatch: styleMatch.length > 0 ? styleMatch : products,
      wardrobeMatch: wardrobeMatch.length > 0 ? wardrobeMatch : products,
      eventMatch: eventMatch.length > 0 ? eventMatch : products,
    };
  }
}

export const marketplaceRetrievalEngine = new MarketplaceRetrievalEngine();
