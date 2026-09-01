import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceSearchResponse,
  MarketplaceProviderStatus,
} from "@/types/marketplace";
import { UserProfile } from "@/types/user";
import { amazonMarketplaceProvider } from "./AmazonMarketplaceProvider";
import { flipkartMarketplaceProvider } from "./FlipkartMarketplaceProvider";
import { IMarketplaceProvider } from "./MarketplaceProvider";

export class MarketplaceAggregator {
  private providers: IMarketplaceProvider[];

  constructor() {
    this.providers = [amazonMarketplaceProvider, flipkartMarketplaceProvider];
  }

  /**
   * Retrieves live status of all registered marketplace providers
   */
  public getProviderStatuses(): MarketplaceProviderStatus[] {
    return this.providers.map((p) => p.getStatus());
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
    const targetPattern = query.pattern?.toLowerCase();
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

        // Reject if it's explicitly a shirt, pants, jeans, or shoes
        const hasContradictingCategory =
          /\b(men's shirt|t-shirt|polo shirt|trousers|blue jeans|black jeans|sneakers|running shoes|blazer jacket)\b/i.test(
            titleLower
          );

        if (!hasDressSignal || hasContradictingCategory) {
          return false;
        }
      } else if (targetCategory === "tops") {
        const hasTopSignal =
          titleLower.includes("shirt") ||
          titleLower.includes("tee") ||
          titleLower.includes("top") ||
          titleLower.includes("polo") ||
          titleLower.includes("blouse") ||
          titleLower.includes("hoodie") ||
          titleLower.includes("sweatshirt") ||
          pCatLower.includes("top");

        const hasContradictingCategory =
          /\b(maxi dress|party dress|evening gown|women's skirt|heels|jeans)\b/i.test(titleLower);

        if (!hasTopSignal || hasContradictingCategory) {
          return false;
        }
      } else if (targetCategory === "bottoms") {
        const hasBottomSignal =
          titleLower.includes("jeans") ||
          titleLower.includes("trouser") ||
          titleLower.includes("pant") ||
          titleLower.includes("chino") ||
          titleLower.includes("short") ||
          titleLower.includes("jogger") ||
          pCatLower.includes("bottom");

        if (!hasBottomSignal) return false;
      } else if (targetCategory === "footwear") {
        const hasFootwearSignal =
          titleLower.includes("shoe") ||
          titleLower.includes("sneaker") ||
          titleLower.includes("boot") ||
          titleLower.includes("heel") ||
          titleLower.includes("loafer") ||
          titleLower.includes("sandal") ||
          pCatLower.includes("footwear");

        if (!hasFootwearSignal) return false;
      }

      // 3. Color Relevance (e.g., "White Shirt" must not return a "Black Shirt", "Red Dress" must not match "tiered")
      if (targetColor) {
        const colorRegex = new RegExp(`\\b${targetColor}\\b`, "i");
        const colorMatches =
          colorRegex.test(titleLower) ||
          pColors.some((c) => colorRegex.test(c));

        // Detect opposing colors when target is specifically white, black, or red
        if (targetColor === "white") {
          const isBlackContradiction = /\bblack\b/i.test(titleLower) && !/\bwhite\b/i.test(titleLower);
          if (isBlackContradiction) return false;
        } else if (targetColor === "black") {
          const isWhiteContradiction = /\bwhite\b/i.test(titleLower) && !/\bblack\b/i.test(titleLower);
          if (isWhiteContradiction) return false;
        } else if (targetColor === "red") {
          const isOpposing = /\b(blue|green|black|white|yellow)\b/i.test(titleLower) && !/\bred\b/i.test(titleLower);
          if (isOpposing && !colorMatches) return false;
        }

        if (!colorMatches) {
          return false;
        }
      }

      // 4. Pattern Relevance (e.g., "Floral Dress")
      if (targetPattern) {
        const patternMatches =
          titleLower.includes(targetPattern) ||
          titleLower.includes("printed") ||
          titleLower.includes("flower");
        if (!patternMatches) return false;
      }

      // 5. Subcategory / Style Specificity (e.g., "Maxi Dress")
      if (targetSubcategory && targetSubcategory.includes("maxi")) {
        if (!titleLower.includes("maxi")) return false;
      }

      // 6. Gender Consistency
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
    userProfile?: UserProfile | null
  ): Promise<MarketplaceSearchResponse> {
    const selectedSource = filters?.source || "All";
    const effectiveGender = filters?.gender || query.gender || userProfile?.gender || "All";
    const statuses = this.getProviderStatuses();
    const hasConnectedProviders = statuses.some((s) => s.isConfigured);

    // Filter providers based on selection
    const activeProviders = this.providers.filter((p) => {
      if (selectedSource === "All") return true;
      return p.name === selectedSource;
    });

    // Execute provider queries concurrently
    const queryPromises = activeProviders.map((p) =>
      p.searchProducts(query, {
        ...filters,
        gender: effectiveGender === "All" ? undefined : (effectiveGender as "Women" | "Men"),
      })
    );

    const providerResults = await Promise.all(queryPromises);
    const rawProducts = providerResults.flat();

    // Deduplicate items
    const deduplicated = this.deduplicateProducts(rawProducts);

    // Strict Relevance Filtering
    const relevantProducts = this.filterByRelevance(deduplicated, query, filters);

    // Score and Rank Products
    const scoredProducts = relevantProducts.map((p) => {
      let relevanceScore = 75;
      let personalizedScore = 65;

      const titleLower = p.title.toLowerCase();
      const styleLower = (query.style || query.subcategory || "").toLowerCase();
      const colorLower = (query.color || "").toLowerCase();

      // Title & Attribute Relevance Scoring
      if (styleLower && titleLower.includes(styleLower)) relevanceScore += 15;
      if (colorLower && titleLower.includes(colorLower)) relevanceScore += 10;
      if (p.rating && p.rating >= 4.0) relevanceScore += 10;

      // Personalization with User Profile
      if (userProfile) {
        // Gender preference alignment
        if (userProfile.gender && userProfile.gender !== "All") {
          if (p.gender === userProfile.gender || p.gender === "Unisex" || p.gender === "All") {
            personalizedScore += 20;
            relevanceScore += 5;
          }
        }

        // Skin Tone Undertone Harmony
        const skinUndertone = userProfile.appearance?.skinTone?.undertone;
        const warmColors = ["beige", "olive", "brown", "cream", "mustard", "tan", "red", "gold"];
        const coolColors = ["navy", "white", "black", "grey", "blue", "burgundy", "silver", "emerald"];

        if (p.colors && p.colors.length > 0) {
          const primaryColor = p.colors[0].toLowerCase();
          if (skinUndertone === "Warm" && warmColors.includes(primaryColor)) {
            personalizedScore += 15;
          } else if (skinUndertone === "Cool" && coolColors.includes(primaryColor)) {
            personalizedScore += 15;
          }
        }

        // Style Preference Alignment
        const userStyles = (userProfile.stylePreferences || []).map((s) => s.toLowerCase());
        if (p.style && userStyles.some((us) => p.style?.toLowerCase().includes(us))) {
          personalizedScore += 15;
        }

        // Preferred Brand Alignment
        if (p.brand && userProfile.preferredBrands?.includes(p.brand)) {
          personalizedScore += 12;
        }

        // Price Budget Alignment
        if (query.budget?.max && p.price <= query.budget.max) {
          personalizedScore += 10;
        }
      }

      return {
        ...p,
        relevanceScore: Math.min(100, relevanceScore),
        personalizedScore: Math.min(100, personalizedScore),
      };
    });

    // Partition into genuine sections
    const bestMatch = [...scoredProducts].sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );

    const bestForYou = [...scoredProducts].sort(
      (a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0)
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
