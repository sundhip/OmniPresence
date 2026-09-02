import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceProviderStatus,
  MarketplaceProviderTestResult,
  MarketplaceProviderHealthStatus,
  MarketplaceProviderName,
} from "@/types/marketplace";
import { IMarketplaceProvider } from "./MarketplaceProvider";

export class SerpApiProvider implements IMarketplaceProvider {
  public readonly name: MarketplaceProviderName = "SerpApi";
  private apiKey: string;
  private country: string;
  private language: string;

  private lastKnownStatus: MarketplaceProviderHealthStatus = "DISABLED";
  private lastCheckedTimestamp: string | null = null;

  public get status(): MarketplaceProviderHealthStatus {
    return this.isConfigured() ? "ACTIVE" : "DISABLED";
  }

  constructor() {
    this.apiKey =
      process.env.SERPAPI_API_KEY ||
      process.env.SERP_API_KEY ||
      process.env.SERPAPI_KEY ||
      "";
    this.country = process.env.SERPAPI_GL || "in";
    this.language = process.env.SERPAPI_HL || "en";

    if (this.isConfigured()) {
      this.lastKnownStatus = "ACTIVE";
    }
  }

  private getApiKey(): string {
    return (
      process.env.SERPAPI_API_KEY ||
      process.env.SERP_API_KEY ||
      process.env.SERPAPI_KEY ||
      this.apiKey ||
      ""
    ).trim();
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.length > 0);
  }

  public getStatus(): MarketplaceProviderStatus {
    const configured = this.isConfigured();
    const activeKey = this.getApiKey();
    let status: MarketplaceProviderHealthStatus = configured
      ? this.lastKnownStatus === "not_configured"
        ? "healthy"
        : this.lastKnownStatus
      : "not_configured";

    let message =
      "SerpApi Google Shopping API key (SERPAPI_API_KEY) is not configured in environment.";
    if (configured) {
      if (status === "healthy" || status === "ACTIVE") {
        message = `Configured for SerpApi Google Shopping (${this.country.toUpperCase()}). Ready for live authenticated searches.`;
      } else if (status === "credentials_invalid") {
        message = "SerpApi authentication failed (Invalid API Key).";
      } else if (status === "rate_limited") {
        message = "SerpApi quota or rate limit exceeded.";
      } else {
        message = "SerpApi service temporarily unavailable.";
      }
    }

    return {
      provider: this.name,
      isConfigured: configured,
      isConnected: configured && (status === "ACTIVE" || status === "healthy"),
      status,
      message,
      lastChecked: this.lastCheckedTimestamp || new Date().toISOString(),
      details: {
        region: this.country,
        apiKeyMasked: configured
          ? `${activeKey.slice(0, 4)}...${activeKey.slice(-4)}`
          : undefined,
      },
    };
  }

  public async testConnection(): Promise<MarketplaceProviderTestResult> {
    const activeKey = this.getApiKey();
    if (!activeKey) {
      return {
        provider: this.name,
        passed: false,
        status: "not_configured",
        latencyMs: 0,
        productCount: 0,
        errorMessage: "SERPAPI_API_KEY environment variable is not set.",
      };
    }

    const startTime = Date.now();
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google_shopping");
      url.searchParams.set("q", "linen shirt");
      url.searchParams.set("api_key", activeKey);
      url.searchParams.set("gl", this.country);
      url.searchParams.set("hl", this.language);
      url.searchParams.set("num", "3");

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(8000),
      });
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        this.lastKnownStatus =
          res.status === 401 || res.status === 403
            ? "credentials_invalid"
            : res.status === 429
            ? "rate_limited"
            : "temporarily_unavailable";
        this.lastCheckedTimestamp = new Date().toISOString();

        return {
          provider: this.name,
          passed: false,
          status: this.lastKnownStatus,
          latencyMs,
          statusCode: res.status,
          productCount: 0,
          errorMessage: `SerpApi returned status ${res.status}: ${errorText.slice(0, 100)}`,
        };
      }

      const json = await res.json();
      const items: any[] = json.shopping_results || [];

      this.lastKnownStatus = "healthy";
      this.lastCheckedTimestamp = new Date().toISOString();

      const sample = items[0]
        ? {
            id: `serp_${items[0].product_id || "sample"}`,
            title: items[0].title || "Google Shopping Product",
            price: items[0].extracted_price || 0,
            imageUrl: items[0].thumbnail || "",
            productUrl: items[0].link || "",
          }
        : null;

      return {
        provider: this.name,
        passed: true,
        status: "healthy",
        latencyMs,
        statusCode: 200,
        productCount: items.length,
        sampleProduct: sample,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      this.lastKnownStatus = "temporarily_unavailable";
      this.lastCheckedTimestamp = new Date().toISOString();

      return {
        provider: this.name,
        passed: false,
        status: "temporarily_unavailable",
        latencyMs,
        productCount: 0,
        errorMessage: err.message || "Failed to reach SerpApi Google Shopping",
      };
    }
  }

  /**
   * Search real products from Google Shopping via SerpApi
   */
  public async searchProducts(
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters,
    signal?: AbortSignal
  ): Promise<MarketplaceProduct[]> {
    const activeKey = this.getApiKey();
    if (!activeKey) {
      return [];
    }

    const effectiveGender = filters?.gender || query.gender;

    // 1. Build optimized search query keywords for Google Shopping
    const searchTerms: string[] = [];
    if (effectiveGender && effectiveGender !== "All" && effectiveGender !== "Unisex") {
      searchTerms.push(effectiveGender);
    }
    if (query.color) {
      searchTerms.push(query.color);
    }
    if (query.fit && query.fit !== "Regular") {
      searchTerms.push(query.fit);
    }
    if (query.style && !searchTerms.some((t) => t.toLowerCase() === query.style?.toLowerCase())) {
      searchTerms.push(query.style);
    }
    if (query.subcategory) {
      searchTerms.push(query.subcategory);
    } else if (query.category) {
      searchTerms.push(query.category);
    }

    // Fallback to searchKeywords or rawQuery if terms are too short
    let finalQuery = searchTerms.join(" ").trim();
    if (finalQuery.length < 3) {
      finalQuery = query.searchKeywords || query.rawQuery;
    }

    // Clean price tokens from the query string so Google Shopping searches products cleanly
    finalQuery = finalQuery
      .replace(/(?:under|below|less than|within|₹|rs\.?)\s*\d+/gi, "")
      .replace(/outfit/gi, "clothing")
      .trim();

    if (!finalQuery) {
      finalQuery = query.rawQuery || "fashion clothing";
    }

    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google_shopping");
      url.searchParams.set("q", finalQuery);
      url.searchParams.set("api_key", activeKey);
      url.searchParams.set("gl", this.country);
      url.searchParams.set("hl", this.language);
      url.searchParams.set("num", "40");

      if (filters?.sortBy === "price_low") {
        url.searchParams.set("tbs", "p_ord:p");
      } else if (filters?.sortBy === "price_high") {
        url.searchParams.set("tbs", "p_ord:pd");
      } else if (filters?.sortBy === "rating") {
        url.searchParams.set("tbs", "p_ord:r");
      }

      const res = await fetch(url.toString(), {
        signal: signal || AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        console.warn(`[SerpApiProvider] Response not OK (${res.status})`);
        return [];
      }

      const data = await res.json();
      if (data.error) {
        console.warn("[SerpApiProvider] API returned error:", data.error);
        return [];
      }

      const results: any[] = data.shopping_results || [];

      return results.map((item, index) => {
        const rawTitle = item.title || "";
        const rawSnippet = item.snippet || "";
        const rawSource = item.source || item.merchant || "Google Shopping";
        const price =
          typeof item.extracted_price === "number"
            ? item.extracted_price
            : this.parseNumericPrice(item.price);
        const oldPrice =
          typeof item.extracted_old_price === "number"
            ? item.extracted_old_price
            : this.parseNumericPrice(item.old_price);

        let discountPercent: number | null = null;
        if (oldPrice && price && oldPrice > price) {
          discountPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
        }

        // Extract delivery information
        const deliveryInfo =
          item.delivery ||
          (Array.isArray(item.extensions) ? item.extensions.join(" • ") : null) ||
          (item.shipping ? `Shipping: ${item.shipping}` : null);

        // Derive category / subcategory
        const inferredCategory = this.inferCategory(rawTitle, query.category);
        const inferredSubcategory = query.subcategory || query.style || inferredCategory;
        const inferredColors = this.extractColors(rawTitle, query.color);
        const inferredFit = this.extractFit(rawTitle, query.fit);

        const idHash = Math.abs(this.simpleHash(item.link || item.product_id || rawTitle));

        return {
          id: `serp_${item.product_id || index}_${idHash}`,
          provider: "SerpApi" as MarketplaceProviderName,
          providerProductId: item.product_id ? String(item.product_id) : undefined,
          title: rawTitle,
          description: rawSnippet || `Available on ${rawSource}`,
          brand: this.extractBrand(rawTitle, rawSource),
          store: rawSource,
          merchant: rawSource,
          imageUrl:
            item.thumbnail ||
            item.image ||
            "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80",
          productUrl:
            item.link ||
            item.product_link ||
            `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(rawTitle)}`,
          price: price || 999,
          originalPrice: oldPrice || null,
          currency: item.price && item.price.includes("$") ? "USD" : "INR",
          discountPercent,
          discountPercentage: discountPercent,
          priceStatus: "live",
          rating: typeof item.rating === "number" ? item.rating : null,
          reviewCount: typeof item.reviews === "number" ? item.reviews : null,
          availability: "in_stock",
          category: inferredCategory,
          subcategory: inferredSubcategory,
          colors: inferredColors,
          sizes: ["S", "M", "L", "XL"],
          fit: inferredFit,
          style: query.style || "Casual",
          occasion: query.occasion || "Everyday",
          season: query.season || "All-Season",
          gender: (effectiveGender === "Men" || effectiveGender === "Women") ? effectiveGender : (query.gender || "All"),
          source: rawSource,
          deliveryInformation: deliveryInfo,
          isBestSeller: Boolean(item.tag && item.tag.toLowerCase().includes("best")),
          isPopular: Boolean((item.reviews && item.reviews > 100) || (item.rating && item.rating >= 4.3)),
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return [];
      }
      console.error("[SerpApiProvider] Search failed:", err);
      return [];
    }
  }

  private parseNumericPrice(val: any): number {
    if (typeof val === "number") return val;
    if (!val || typeof val !== "string") return 0;
    const cleaned = val.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  private extractBrand(title: string, source: string): string {
    const knownBrands = [
      "Nike", "Adidas", "Puma", "Zara", "H&M", "Levi's", "Levis", "Marks & Spencer",
      "Tommy Hilfiger", "Calvin Klein", "Allen Solly", "Peter England", "Van Heusen",
      "Louis Philippe", "Fabindia", "Biba", "Manyavar", "W", "Aurelia", "Mufti",
      "Jack & Jones", "Vero Moda", "Only", "Under Armour", "Uniqlo", "Roadster",
      "HRX", "Highlander", "Dennis Lingo", "Rare Rabbit", "Snitch", "The Souled Store"
    ];

    for (const b of knownBrands) {
      const regex = new RegExp(`\\b${b}\\b`, "i");
      if (regex.test(title)) {
        return b;
      }
    }

    if (source && !source.toLowerCase().includes("google")) {
      return source.replace(/\.com|\.in/gi, "").trim();
    }

    const firstWord = title.split(" ")[0];
    return firstWord.length > 2 ? firstWord : "Retail Store";
  }

  private inferCategory(title: string, defaultCat?: string): string {
    const t = title.toLowerCase();
    if (/\b(kurta|kurti|saree|sari|lehenga|salwar|sherwani|dhoti|pajama|pyjama|anarkali|nehru|bandhgala|sharara)\b/i.test(t)) {
      return "Ethnic Wear";
    }
    if (/\b(shirt|t-shirt|tee|polo|blouse|sweater|hoodie|sweatshirt|top|tops|cardigan)\b/i.test(t)) {
      return "Tops";
    }
    if (/\b(jeans|pant|pants|trouser|trousers|chino|chinos|short|shorts|skirt|bottom|bottoms|jogger|joggers|cargo)\b/i.test(t)) {
      return "Bottoms";
    }
    if (/\b(dress|gown|maxi|midi|mini|frock|jumpsuit|sundress)\b/i.test(t)) {
      return "Dresses";
    }
    if (/\b(blazer|coat|jacket|overcoat|trench|bomber)\b/i.test(t)) {
      return "Outerwear";
    }
    if (/\b(shoe|shoes|sneaker|sneakers|boot|boots|sandal|sandals|loafer|loafers|heel|heels|flat|flats|jutti|mojari)\b/i.test(t)) {
      return "Footwear";
    }
    if (/\b(bag|watch|belt|sunglasses|jewellery|jewelry|cap|hat|scarf|tote)\b/i.test(t)) {
      return "Accessories";
    }
    return defaultCat || "Tops";
  }

  private extractColors(title: string, queryColor?: string): string[] {
    const colors = [
      "black", "white", "blue", "navy", "red", "maroon", "green", "olive", "emerald",
      "yellow", "mustard", "beige", "tan", "brown", "grey", "gray",
      "pink", "purple", "orange", "burgundy", "charcoal", "cream", "gold", "silver", "mint"
    ];
    const t = title.toLowerCase();
    const found: string[] = [];

    if (queryColor) {
      found.push(queryColor);
    }

    for (const c of colors) {
      if (new RegExp(`\\b${c}\\b`, "i").test(t)) {
        const capitalized = c.charAt(0).toUpperCase() + c.slice(1);
        if (!found.includes(capitalized)) {
          found.push(capitalized);
        }
      }
    }

    return found.length > 0 ? found : ["Multi"];
  }

  private extractFit(title: string, queryFit?: string): string {
    const t = title.toLowerCase();
    if (t.includes("oversized") || t.includes("baggy") || t.includes("loose")) return "Oversized";
    if (t.includes("slim") || t.includes("skinny") || t.includes("tailored")) return "Slim";
    if (t.includes("relaxed")) return "Relaxed";
    return queryFit || "Regular";
  }
}

export const serpApiProvider = new SerpApiProvider();
