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

export class FlipkartMarketplaceProvider implements IMarketplaceProvider {
  public readonly name: MarketplaceProviderName = "Flipkart";
  private affiliateId: string;
  private affiliateToken: string;

  // Cached health status
  private lastKnownStatus: MarketplaceProviderHealthStatus = "DISABLED";
  private lastCheckedTimestamp: string | null = null;

  public get status(): MarketplaceProviderHealthStatus {
    return this.isConfigured() ? "ACTIVE" : "DISABLED";
  }

  constructor() {
    this.affiliateId =
      process.env.FLIPKART_AFFILIATE_ID || process.env.FLIPKART_API_KEY || "";
    this.affiliateToken =
      process.env.FLIPKART_AFFILIATE_TOKEN || process.env.FLIPKART_API_SECRET || "";

    if (this.isConfigured()) {
      this.lastKnownStatus = "ACTIVE";
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.affiliateId && this.affiliateToken);
  }

  public getStatus(): MarketplaceProviderStatus {
    const configured = this.isConfigured();
    let status: MarketplaceProviderHealthStatus = configured
      ? this.lastKnownStatus === "not_configured"
        ? "healthy"
        : this.lastKnownStatus
      : "not_configured";

    let message = "Flipkart Affiliate credentials (FLIPKART_AFFILIATE_ID, FLIPKART_AFFILIATE_TOKEN) are not configured in environment.";
    if (configured) {
      if (status === "healthy") {
        message = "Configured for Flipkart Affiliate API. Ready for live authenticated queries.";
      } else if (status === "credentials_invalid") {
        message = "Flipkart Affiliate API authentication failed (Invalid Affiliate ID or Token).";
      } else if (status === "rate_limited") {
        message = "Flipkart Affiliate API rate limit exceeded.";
      } else {
        message = "Flipkart Affiliate service temporarily unavailable.";
      }
    }

    return {
      provider: "Flipkart",
      isConfigured: configured,
      isConnected: configured && status === "healthy",
      status,
      message,
      lastChecked: this.lastCheckedTimestamp || undefined,
      details: {
        affiliateIdMasked: this.affiliateId ? `${this.affiliateId.slice(0, 3)}***` : undefined,
      },
    };
  }

  /**
   * Diagnostic live test for Flipkart Affiliate API connection
   */
  public async testConnection(): Promise<MarketplaceProviderTestResult> {
    const start = Date.now();
    if (!this.isConfigured()) {
      this.lastKnownStatus = "not_configured";
      this.lastCheckedTimestamp = new Date().toISOString();
      return {
        provider: "Flipkart",
        passed: false,
        status: "not_configured",
        latencyMs: 0,
        productCount: 0,
        errorMessage: "Credentials not configured in environment.",
      };
    }

    try {
      const endpoint = `https://affiliate-api.flipkart.net/affiliate/1.0/search.json?query=dress&resultCount=3`;
      const response = await fetch(endpoint, {
        headers: {
          "Fk-Affiliate-Id": this.affiliateId,
          "Fk-Affiliate-Token": this.affiliateToken,
        },
      });

      const latency = Date.now() - start;
      this.lastCheckedTimestamp = new Date().toISOString();

      if (response.status === 200) {
        const data = await response.json();
        const products = data.products || [];
        this.lastKnownStatus = "healthy";

        const sample = products[0]?.productBaseInfoV1
          ? {
              id: products[0].productBaseInfoV1.productId,
              title: products[0].productBaseInfoV1.title || "Flipkart Product",
              price: products[0].productBaseInfoV1.flipkartSellingPrice?.amount || 0,
              imageUrl:
                products[0].productBaseInfoV1.imageUrls?.["400x400"] ||
                Object.values(products[0].productBaseInfoV1.imageUrls || {})[0] ||
                "",
              productUrl: products[0].productBaseInfoV1.productUrl || "",
            }
          : null;

        return {
          provider: "Flipkart",
          passed: true,
          status: "healthy",
          statusCode: 200,
          latencyMs: latency,
          productCount: products.length,
          sampleProduct: sample,
        };
      }

      if (response.status === 401 || response.status === 403) {
        this.lastKnownStatus = "credentials_invalid";
        return {
          provider: "Flipkart",
          passed: false,
          status: "credentials_invalid",
          statusCode: response.status,
          latencyMs: latency,
          productCount: 0,
          errorMessage: `Authentication failed (HTTP ${response.status}): Check Flipkart Affiliate ID and Token.`,
        };
      }

      if (response.status === 429) {
        this.lastKnownStatus = "rate_limited";
        return {
          provider: "Flipkart",
          passed: false,
          status: "rate_limited",
          statusCode: 429,
          latencyMs: latency,
          productCount: 0,
          errorMessage: "Flipkart Affiliate API rate limit reached.",
        };
      }

      this.lastKnownStatus = "temporarily_unavailable";
      return {
        provider: "Flipkart",
        passed: false,
        status: "temporarily_unavailable",
        statusCode: response.status,
        latencyMs: latency,
        productCount: 0,
        errorMessage: `Unexpected Flipkart response status: ${response.status}`,
      };
    } catch (err: any) {
      this.lastKnownStatus = "temporarily_unavailable";
      this.lastCheckedTimestamp = new Date().toISOString();
      return {
        provider: "Flipkart",
        passed: false,
        status: "temporarily_unavailable",
        latencyMs: Date.now() - start,
        productCount: 0,
        errorMessage: err.message || "Network error communicating with Flipkart API.",
      };
    }
  }

  public buildSearchKeywords(
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters
  ): string {
    const parts: string[] = [];
    const effectiveGender = filters?.gender || query.gender;

    if (effectiveGender && effectiveGender !== "All") {
      parts.push(effectiveGender);
    }
    if (filters?.selectedColors && filters.selectedColors.length > 0) {
      parts.push(filters.selectedColors.join(" "));
    } else if (query.color) {
      parts.push(query.color);
    }
    if (query.pattern) {
      parts.push(query.pattern);
    }
    if (filters?.selectedStyles && filters.selectedStyles.length > 0) {
      parts.push(filters.selectedStyles.join(" "));
    } else if (query.subcategory) {
      parts.push(query.subcategory);
    } else if (query.category) {
      parts.push(query.category);
    }

    return parts.join(" ").trim() || query.rawQuery;
  }

  public async searchProducts(
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters
  ): Promise<MarketplaceProduct[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const keywords = this.buildSearchKeywords(query, filters);

    try {
      const endpoint = `https://affiliate-api.flipkart.net/affiliate/1.0/search.json?query=${encodeURIComponent(
        keywords
      )}&resultCount=10`;

      const response = await fetch(endpoint, {
        headers: {
          "Fk-Affiliate-Id": this.affiliateId,
          "Fk-Affiliate-Token": this.affiliateToken,
        },
      });

      this.lastCheckedTimestamp = new Date().toISOString();

      if (response.ok) {
        this.lastKnownStatus = "healthy";
        const data = await response.json();
        if (!data.products || !Array.isArray(data.products)) {
          return [];
        }

        return data.products
          .map((p: any) => this.normalizeFlipkartItem(p, query, filters))
          .filter((p: MarketplaceProduct | null): p is MarketplaceProduct => p !== null);
      }

      if (response.status === 401 || response.status === 403) {
        this.lastKnownStatus = "credentials_invalid";
        console.warn(`[FlipkartMarketplaceProvider] Authentication failed (HTTP ${response.status})`);
      } else if (response.status === 429) {
        this.lastKnownStatus = "rate_limited";
        console.warn("[FlipkartMarketplaceProvider] Rate limited (HTTP 429)");
      } else {
        this.lastKnownStatus = "temporarily_unavailable";
        console.warn(`[FlipkartMarketplaceProvider] API HTTP ${response.status}: ${response.statusText}`);
      }

      return [];
    } catch (err) {
      this.lastKnownStatus = "temporarily_unavailable";
      console.warn("[FlipkartMarketplaceProvider] Fetch error:", err);
      return [];
    }
  }

  private normalizeFlipkartItem(
    item: any,
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters
  ): MarketplaceProduct | null {
    const baseInfo = item.productBaseInfoV1;
    if (!baseInfo) return null;

    const productId = baseInfo.productId;
    const title = baseInfo.title;
    const productUrl = baseInfo.productUrl;
    const imageUrl =
      baseInfo.imageUrls?.["800x800"] ||
      baseInfo.imageUrls?.["400x400"] ||
      baseInfo.imageUrls?.["200x200"] ||
      Object.values(baseInfo.imageUrls || {})[0];

    // Reject items lacking essential product identity
    if (!productId || !title || !imageUrl || !productUrl) {
      return null;
    }

    const price = baseInfo.flipkartSellingPrice?.amount || 0;
    const originalPrice = baseInfo.maximumRetailPrice?.amount || null;
    const discountPercent =
      baseInfo.discountPercentage ||
      (originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : null);

    const brand = baseInfo.productBrand || null;
    const rating = baseInfo.productRating?.averageRating || null;
    const reviewCount = baseInfo.productRating?.totalRatingCount || null;
    const deliveryInformation = baseInfo.codAvailable ? "Cash on Delivery Available" : null;

    return {
      id: productId,
      provider: "Flipkart",
      title,
      brand,
      imageUrl,
      productUrl,
      price,
      originalPrice,
      currency: "₹",
      discountPercent,
      rating,
      reviewCount,
      category: query.category || "Fashion",
      subcategory: query.subcategory || null,
      style: query.style || null,
      gender: filters?.gender || query.gender || null,
      colors: query.color ? [query.color] : undefined,
      availability: baseInfo.inStock ? "In Stock" : "Out of Stock",
      deliveryInformation,
    };
  }
}

export const flipkartMarketplaceProvider = new FlipkartMarketplaceProvider();
