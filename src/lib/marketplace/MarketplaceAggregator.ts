import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceSearchResponse,
  MarketplaceProviderStatus,
} from "@/types/marketplace";
import { UserProfile } from "@/types/user";
import { WardrobeItem } from "@/types/wardrobe";
import { EventItem } from "@/types/events";
import { marketplaceProviderRegistry } from "./MarketplaceProviderRegistry";
import { marketplaceRetrievalEngine } from "./MarketplaceRetrievalEngine";
import { WeatherContextData } from "./MarketplaceContextEngine";
import { AppStorage } from "@/lib/storage";

export class MarketplaceAggregator {
  /**
   * Retrieves live status of all registered marketplace providers
   */
  public getProviderStatuses(): MarketplaceProviderStatus[] {
    return marketplaceProviderRegistry.getProviderStatuses();
  }

  /**
   * Strict product deduplication across all providers
   */
  public deduplicateProducts(products: MarketplaceProduct[]): MarketplaceProduct[] {
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const seenImages = new Set<string>();
    const seenTitles = new Set<string>();
    const unique: MarketplaceProduct[] = [];

    for (const p of products) {
      const idKey = `${p.provider}:${p.id}`.toLowerCase();
      const urlKey = (p.productUrl || "").toLowerCase().trim();
      const imgKey = (p.imageUrl || "").toLowerCase().trim();
      const titleKey = (p.title || "").toLowerCase().trim().slice(0, 40);

      if (seenIds.has(idKey)) continue;
      if (urlKey && seenUrls.has(urlKey)) continue;
      if (imgKey && seenImages.has(imgKey)) continue;
      if (titleKey && seenTitles.has(titleKey)) continue;

      seenIds.add(idKey);
      if (urlKey) seenUrls.add(urlKey);
      if (imgKey) seenImages.add(imgKey);
      if (titleKey) seenTitles.add(titleKey);

      unique.push(p);
    }

    return unique;
  }

  /**
   * Strict Relevance Filter:
   * Re-evaluates every candidate product against query criteria and filters.
   */
  public filterByRelevance(
    products: MarketplaceProduct[],
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters
  ): MarketplaceProduct[] {
    const targetCategory = (filters?.selectedCategory || query.category)?.toLowerCase();
    const targetColor = (filters?.selectedColors?.[0] || query.color)?.toLowerCase();
    const targetFit = (filters?.selectedFits?.[0] || query.fit)?.toLowerCase();
    const effectiveGender = filters?.gender || query.gender;
    const maxBudget = filters?.maxPrice || query.budget?.max;
    const minBudget = filters?.minPrice || query.budget?.min;
    const minRating = filters?.minRating;

    return products.filter((p) => {
      const titleLower = p.title.toLowerCase();
      const pCatLower = (p.category || "").toLowerCase();
      const pColors = (p.colors || []).map((c) => c.toLowerCase());

      // 1. Budget Constraint
      if (maxBudget !== undefined && p.price > maxBudget) {
        return false;
      }
      if (minBudget !== undefined && p.price < minBudget) {
        return false;
      }

      // 2. Rating Filter
      if (minRating !== undefined && p.rating !== null && p.rating !== undefined && p.rating < minRating) {
        return false;
      }

      // 3. Category Relevance
      if (targetCategory === "ethnic wear" || targetCategory === "traditional") {
        if (pCatLower !== "ethnic wear" && pCatLower !== "traditional") {
          const hasEthnicSignal =
            titleLower.includes("kurta") ||
            titleLower.includes("kurti") ||
            titleLower.includes("saree") ||
            titleLower.includes("lehenga") ||
            titleLower.includes("sherwani") ||
            titleLower.includes("dhoti") ||
            titleLower.includes("anarkali") ||
            titleLower.includes("nehru");
          if (!hasEthnicSignal) return false;
        }
      } else if (targetCategory === "dresses") {
        if (pCatLower === "tops" || pCatLower === "bottoms" || pCatLower === "outerwear" || pCatLower === "footwear") {
          return false;
        }
        if (pCatLower !== "dresses") {
          const hasDressSignal =
            (titleLower.includes("dress") && !titleLower.includes("dress shirt")) ||
            titleLower.includes("gown") ||
            titleLower.includes("maxi") ||
            titleLower.includes("sundress") ||
            titleLower.includes("frock");
          if (!hasDressSignal) return false;
        }
      } else if (targetCategory === "tops") {
        if (pCatLower === "dresses" || pCatLower === "bottoms" || pCatLower === "footwear") {
          return false;
        }
        if (pCatLower !== "tops") {
          const hasTopSignal =
            titleLower.includes("shirt") ||
            titleLower.includes("tee") ||
            titleLower.includes("t-shirt") ||
            titleLower.includes("polo") ||
            titleLower.includes("blouse") ||
            titleLower.includes("sweater") ||
            titleLower.includes("hoodie");
          if (!hasTopSignal) return false;
        }
      } else if (targetCategory === "bottoms") {
        if (pCatLower === "tops" || pCatLower === "dresses" || pCatLower === "outerwear" || pCatLower === "footwear") {
          return false;
        }
        if (pCatLower !== "bottoms") {
          const hasBottomSignal =
            titleLower.includes("jean") ||
            titleLower.includes("pant") ||
            titleLower.includes("trouser") ||
            titleLower.includes("chino") ||
            titleLower.includes("cargo") ||
            titleLower.includes("skirt");
          if (!hasBottomSignal) return false;
        }
      } else if (targetCategory === "outerwear") {
        if (pCatLower === "dresses" || pCatLower === "bottoms" || pCatLower === "footwear") {
          return false;
        }
        if (pCatLower !== "outerwear") {
          const hasOuterSignal =
            titleLower.includes("blazer") ||
            titleLower.includes("coat") ||
            titleLower.includes("jacket") ||
            titleLower.includes("trench");
          if (!hasOuterSignal) return false;
        }
      } else if (targetCategory === "footwear") {
        if (pCatLower !== "footwear") {
          const hasFootSignal =
            titleLower.includes("shoe") ||
            titleLower.includes("sneaker") ||
            titleLower.includes("loafer") ||
            titleLower.includes("sandal") ||
            titleLower.includes("heel") ||
            titleLower.includes("jutti");
          if (!hasFootSignal) return false;
        }
      }

      // 4. Color Relevance
      if (targetColor) {
        const hasColorMatch =
          pColors.some((c) => c.includes(targetColor) || targetColor.includes(c)) ||
          titleLower.includes(targetColor);

        if (!hasColorMatch) {
          const conflictingColors = [
            "red", "white", "black", "blue", "green", "pink", "yellow", "navy", "grey", "tan"
          ].filter((c) => c !== targetColor);

          const hasExplicitConflict = conflictingColors.some(
            (cc) => titleLower.includes(` ${cc} `) || titleLower.startsWith(`${cc} `)
          );
          if (hasExplicitConflict) return false;
        }
      }

      // 5. Fit Relevance
      if (targetFit && targetFit !== "regular") {
        if (!titleLower.includes(targetFit) && p.fit?.toLowerCase() !== targetFit) {
          // Soft check: allow if title is broad, but prioritize exact fit
        }
      }

      // 6. Brand Filter
      if (filters?.selectedBrands && filters.selectedBrands.length > 0) {
        const matchesBrand = filters.selectedBrands.some(
          (b) => p.brand?.toLowerCase() === b.toLowerCase() || p.store?.toLowerCase().includes(b.toLowerCase())
        );
        if (!matchesBrand) return false;
      }

      // 7. Gender Consistency
      if (effectiveGender && effectiveGender !== "All") {
        if (effectiveGender === "Men") {
          if (/\b(women's|womens|ladies|girls|female)\b/i.test(titleLower)) return false;
        } else if (effectiveGender === "Women") {
          if (/\b(men's|mens|gents|gentlemen|boys|male)\b/i.test(titleLower)) return false;
        }
      }

      return true;
    });
  }

  /**
   * Aggregates, validates, deduplicates, and ranks products across connected providers
   */
  public async searchAndRank(
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters,
    userProfile?: UserProfile | null,
    userId?: string,
    context?: {
      upcomingEvents?: EventItem[];
      weather?: WeatherContextData | null;
    }
  ): Promise<MarketplaceSearchResponse> {
    const selectedSource = filters?.source || "All";
    const effectiveGender = filters?.gender || query.gender || userProfile?.gender || "All";
    const statuses = this.getProviderStatuses();
    const hasConnectedProviders = statuses.some((s) => s.isConfigured);

    // 1. Get active providers
    const activeProviders = marketplaceProviderRegistry.getActiveProviders(selectedSource);

    // 2. Execute provider queries concurrently with error shielding
    const queryPromises = activeProviders.map(async (p) => {
      try {
        return await p.searchProducts(query, {
          ...filters,
          gender: effectiveGender === "All" ? undefined : (effectiveGender as "Women" | "Men"),
        });
      } catch (err) {
        console.warn(`[MarketplaceAggregator] Provider ${p.name} search failed:`, err);
        return [];
      }
    });

    const providerResults = await Promise.all(queryPromises);
    const rawProducts = providerResults.flat();

    // 3. Strict Deduplication
    const deduplicated = this.deduplicateProducts(rawProducts);

    // 4. Strict Relevance Filtering
    const relevantProducts = this.filterByRelevance(deduplicated, query, filters);

    // 5. Retrieve User Wardrobe, Calendar Events, and Weather for isolation
    const targetUserId = userId || userProfile?.id || AppStorage.getActiveUserId() || "";
    const wardrobeItems: WardrobeItem[] = targetUserId ? AppStorage.getWardrobe(targetUserId) : [];
    const upcomingEvents: EventItem[] = context?.upcomingEvents || (targetUserId ? AppStorage.getEvents(targetUserId) : []);
    const weather = context?.weather || null;

    // 6. Score and Rank Products via Multi-Signal Hybrid Engine
    const scoredProducts = relevantProducts.map((p) => {
      const hybridScores = marketplaceRetrievalEngine.computeHybridScores(
        p,
        query,
        wardrobeItems,
        userProfile,
        filters,
        upcomingEvents,
        weather
      );

      const wardrobeEval = marketplaceRetrievalEngine.evaluateWardrobeCompatibility(p, wardrobeItems);
      const needEval = marketplaceRetrievalEngine.evaluateDoINeedThis(p, wardrobeItems, userProfile);

      const recommendationReason = marketplaceRetrievalEngine.generateGroundedRecommendationReason(
        p,
        query,
        userProfile,
        wardrobeItems,
        upcomingEvents,
        weather
      );

      // Assign badge
      let recommendationBadge = "Recommended";
      if (hybridScores.finalScore >= 88) {
        recommendationBadge = "Top Pick";
      } else if (needEval.verdict === "Essential Addition") {
        recommendationBadge = "Wardrobe Gap";
      } else if (wardrobeEval.score >= 85) {
        recommendationBadge = "Wardrobe Match";
      } else if (p.rating && p.rating >= 4.5) {
        recommendationBadge = "Top Rated";
      } else if (p.isBestSeller || p.isPopular) {
        recommendationBadge = "Popular";
      }

      return {
        ...p,
        relevanceScore: hybridScores.semanticScore,
        personalizedScore: hybridScores.finalScore,
        wardrobeCompatibilityScore: wardrobeEval.score,
        needScore: needEval.needScore,
        needVerdict: needEval.verdict,
        recommendationReason,
        recommendationBadge,
        scores: hybridScores,
      };
    });

    // 7. Dynamic Sorting
    const sortBy = filters?.sortBy || "recommended";
    const sortedProducts = [...scoredProducts].sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "popular") return (b.reviewCount || 0) - (a.reviewCount || 0);
      if (sortBy === "best_match") return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (sortBy === "wardrobe_match") return (b.wardrobeCompatibilityScore || 0) - (a.wardrobeCompatibilityScore || 0);
      // default: recommended / best_for_you
      return (b.personalizedScore || 0) - (a.personalizedScore || 0);
    });

    // 8. Partition into all 9 sections
    const sections = marketplaceRetrievalEngine.partitionSections(scoredProducts);

    // 9. Extract dynamic facets
    const availableBrands = Array.from(
      new Set(relevantProducts.map((p) => p.brand).filter((b): b is string => Boolean(b)))
    );
    const availableColors = Array.from(
      new Set(
        relevantProducts
          .flatMap((p) => p.colors || [])
          .filter((c): c is string => Boolean(c))
      )
    );
    const availableCategories = Array.from(
      new Set(relevantProducts.map((p) => p.category).filter(Boolean))
    );

    const prices = relevantProducts.map((p) => p.price).filter((pr) => pr > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const isFallback = relevantProducts.length === 0 && !hasConnectedProviders;

    return {
      query: {
        ...query,
        gender: effectiveGender as any,
      },
      totalProducts: relevantProducts.length,
      products: sortedProducts,
      sections,
      discoveredStyles: query.discoveredStyles,
      availableBrands,
      availableColors,
      availableCategories,
      priceRange: {
        min: minPrice,
        max: maxPrice,
      },
      providerStatuses: statuses,
      hasConnectedProviders,
      isFallback,
      fallbackMessage: isFallback
        ? "Product recommendations are temporarily unavailable. Please configure SERPAPI_API_KEY in your environment or try again."
        : undefined,
    };
  }
}

export const marketplaceAggregator = new MarketplaceAggregator();
