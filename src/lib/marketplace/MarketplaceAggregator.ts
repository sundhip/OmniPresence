import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceSearchResponse,
  MarketplaceProviderStatus,
} from "@/types/marketplace";
import { UserProfile } from "@/types/user";
import { marketplaceProviderRegistry } from "./MarketplaceProviderRegistry";
import { marketplaceRetrievalEngine } from "./MarketplaceRetrievalEngine";
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
    const unique: MarketplaceProduct[] = [];

    for (const p of products) {
      const idKey = `${p.provider}:${p.id}`.toLowerCase();
      const urlKey = (p.productUrl || "").toLowerCase().trim();
      const imgKey = (p.imageUrl || "").toLowerCase().trim();

      if (seenIds.has(idKey)) continue;
      if (urlKey && seenUrls.has(urlKey)) continue;
      if (imgKey && seenImages.has(imgKey)) continue;

      seenIds.add(idKey);
      if (urlKey) seenUrls.add(urlKey);
      if (imgKey) seenImages.add(imgKey);

      unique.push(p);
    }

    return unique;
  }

  /**
   * Strict Relevance Filter:
   * Re-evaluates every candidate product against the query's category, color,
   * pattern, subcategory, gender, and budget. Discards irrelevant or conflicting items.
   */
  public filterByRelevance(
    products: MarketplaceProduct[],
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters
  ): MarketplaceProduct[] {
    const targetCategory = query.category?.toLowerCase();
    const targetColor = (filters?.selectedColors?.[0] || query.color)?.toLowerCase();
    const targetSubcategory = (filters?.selectedStyles?.[0] || query.subcategory || query.style)?.toLowerCase();
    const effectiveGender = filters?.gender || query.gender;
    const maxBudget = filters?.maxPrice || query.budget?.max;
    const minBudget = filters?.minPrice || query.budget?.min;

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

      // 2. Category Relevance
      if (targetCategory === "dresses") {
        const hasDressSignal =
          titleLower.includes("dress") ||
          titleLower.includes("gown") ||
          titleLower.includes("maxi") ||
          titleLower.includes("midi") ||
          titleLower.includes("frock") ||
          titleLower.includes("kurti") ||
          titleLower.includes("jumpsuit") ||
          pCatLower.includes("dress");

        const hasContradictingCategory =
          /\b(men's shirt|t-shirt|polo shirt|trousers|blue jeans|black jeans|sneakers|running shoes|blazer jacket)\b/i.test(
            titleLower
          );
        if (hasContradictingCategory && !hasDressSignal) return false;
        if (!hasDressSignal && pCatLower !== "dresses") return false;
      } else if (targetCategory === "tops") {
        const hasTopSignal =
          titleLower.includes("shirt") ||
          titleLower.includes("tee") ||
          titleLower.includes("t-shirt") ||
          titleLower.includes("polo") ||
          titleLower.includes("blouse") ||
          titleLower.includes("top") ||
          titleLower.includes("sweater") ||
          pCatLower.includes("top");

        const hasContradictingCategory =
          /\b(jeans|pants|trousers|dress|gown|sneakers|loafers)\b/i.test(titleLower);
        if (hasContradictingCategory && !hasTopSignal) return false;
      } else if (targetCategory === "bottoms") {
        const hasBottomSignal =
          titleLower.includes("jean") ||
          titleLower.includes("pant") ||
          titleLower.includes("trouser") ||
          titleLower.includes("chino") ||
          titleLower.includes("short") ||
          pCatLower.includes("bottom");

        const hasContradictingCategory =
          /\b(shirt|t-shirt|polo|sweater|dress|blazer)\b/i.test(titleLower);
        if (hasContradictingCategory && !hasBottomSignal) return false;
      }

      // 3. Color Relevance
      if (targetColor) {
        const hasColorMatch =
          pColors.some((c) => c.includes(targetColor) || targetColor.includes(c)) ||
          titleLower.includes(targetColor);

        // Discard contradicting primary colors
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

      // 4. Subcategory / Style Specificity (e.g., "Maxi Dress")
      if (targetSubcategory && targetSubcategory.includes("maxi")) {
        if (!titleLower.includes("maxi")) return false;
      }

      // 5. Gender Consistency
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
    userId?: string
  ): Promise<MarketplaceSearchResponse> {
    const selectedSource = filters?.source || "All";
    const effectiveGender = filters?.gender || query.gender || userProfile?.gender || "All";
    const statuses = this.getProviderStatuses();
    const hasConnectedProviders = statuses.some((s) => s.isConfigured);

    // 1. Get active providers based on selection and configuration
    const activeProviders = marketplaceProviderRegistry.getActiveProviders(selectedSource);

    // 2. Execute provider queries concurrently with error shielding
    const queryPromises = activeProviders.map(async (p) => {
      try {
        return await p.searchProducts(query, {
          ...filters,
          gender: effectiveGender === "All" ? undefined : (effectiveGender as "Women" | "Men"),
        });
      } catch (err) {
        console.warn(`Provider ${p.name} search failed:`, err);
        return [];
      }
    });

    const providerResults = await Promise.all(queryPromises);
    const rawProducts = providerResults.flat();

    // 3. Deduplicate items
    const deduplicated = this.deduplicateProducts(rawProducts);

    // 4. Strict Relevance Filtering
    const relevantProducts = this.filterByRelevance(deduplicated, query, filters);

    // 5. Retrieve User Wardrobe for isolated scoring
    const targetUserId = userId || userProfile?.id || AppStorage.getActiveUserId() || "";
    const wardrobeItems = targetUserId ? AppStorage.getWardrobe(targetUserId) : [];

    // 6. Score and Rank Products via Hybrid Engine
    const scoredProducts = relevantProducts.map((p) => {
      const hybridScores = marketplaceRetrievalEngine.computeHybridScores(
        p,
        query,
        wardrobeItems,
        userProfile,
        filters
      );

      const wardrobeEval = marketplaceRetrievalEngine.evaluateWardrobeCompatibility(p, wardrobeItems);
      const needEval = marketplaceRetrievalEngine.evaluateDoINeedThis(p, wardrobeItems, userProfile);

      return {
        ...p,
        relevanceScore: hybridScores.semanticScore,
        personalizedScore: hybridScores.finalScore,
        wardrobeCompatibilityScore: wardrobeEval.score,
        needScore: needEval.needScore,
        needVerdict: needEval.verdict,
        recommendationReason: `${wardrobeEval.reasoning} ${needEval.reasons[0] || ""}`.trim(),
        scores: hybridScores,
      };
    });

    // 7. Partition into genuine UX sections
    const bestMatch = [...scoredProducts].sort(
      (a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0)
    );

    const bestForYou = [...scoredProducts].sort(
      (a, b) => (b.wardrobeCompatibilityScore || 0) - (a.wardrobeCompatibilityScore || 0)
    );

    const costEffective = [...scoredProducts].sort((a, b) => a.price - b.price);

    const highestRated = [...scoredProducts]
      .filter((p) => p.rating !== null && p.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Facet extraction
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

    const prices = relevantProducts.map((p) => p.price).filter((pr) => pr > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      query: {
        ...query,
        gender: effectiveGender as any,
      },
      totalProducts: relevantProducts.length,
      products: bestMatch,
      sections: {
        bestMatch,
        bestForYou,
        costEffective,
        highestRated,
      },
      discoveredStyles: query.discoveredStyles,
      availableBrands,
      availableColors,
      priceRange: {
        min: minPrice,
        max: maxPrice,
      },
      providerStatuses: statuses,
      hasConnectedProviders,
    };
  }
}

export const marketplaceAggregator = new MarketplaceAggregator();
