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
import { generateAwsSigV4Headers } from "./awsSigV4";

export class AmazonMarketplaceProvider implements IMarketplaceProvider {
  public readonly name: MarketplaceProviderName = "Amazon";
  private partnerTag: string;
  private accessKey: string;
  private secretKey: string;
  private host: string;
  private region: string;

  // Cached health status
  private lastKnownStatus: MarketplaceProviderHealthStatus = "DISABLED";
  private lastCheckedTimestamp: string | null = null;

  public get status(): MarketplaceProviderHealthStatus {
    return this.isConfigured() ? "ACTIVE" : "DISABLED";
  }

  constructor() {
    this.partnerTag = process.env.AMAZON_PARTNER_TAG || "";
    this.accessKey = process.env.AMAZON_ACCESS_KEY || "";
    this.secretKey = process.env.AMAZON_SECRET_KEY || "";
    this.host = process.env.AMAZON_HOST || "webservices.amazon.in";
    this.region =
      process.env.AMAZON_REGION ||
      (this.host.includes(".in") ? "eu-west-1" : "us-east-1");

    if (this.isConfigured()) {
      this.lastKnownStatus = "ACTIVE";
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.partnerTag && this.accessKey && this.secretKey);
  }

  public getStatus(): MarketplaceProviderStatus {
    const configured = this.isConfigured();
    let status: MarketplaceProviderHealthStatus = configured
      ? this.lastKnownStatus === "not_configured"
        ? "healthy"
        : this.lastKnownStatus
      : "not_configured";

    let message = "Amazon API credentials (AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG) are not configured in environment.";
    if (configured) {
      if (status === "healthy") {
        message = `Configured for ${this.host} (${this.region}). Ready for live authenticated queries.`;
      } else if (status === "credentials_invalid") {
        message = "Amazon API authentication failed (Invalid Access Key, Secret Key, or Partner Tag).";
      } else if (status === "rate_limited") {
        message = "Amazon PA-API rate limit exceeded. Request throttled.";
      } else {
        message = "Amazon API service temporarily unavailable.";
      }
    }

    return {
      provider: "Amazon",
      isConfigured: configured,
      isConnected: configured && status === "healthy",
      status,
      message,
      lastChecked: this.lastCheckedTimestamp || undefined,
      details: {
        host: this.host,
        region: this.region,
        partnerTagMasked: this.partnerTag ? `${this.partnerTag.slice(0, 3)}***` : undefined,
      },
    };
  }

  /**
   * Diagnostic live test for Amazon PA-API 5.0 connection
   */
  public async testConnection(): Promise<MarketplaceProviderTestResult> {
    const start = Date.now();
    if (!this.isConfigured()) {
      this.lastKnownStatus = "not_configured";
      this.lastCheckedTimestamp = new Date().toISOString();
      return {
        provider: "Amazon",
        passed: false,
        status: "not_configured",
        latencyMs: 0,
        productCount: 0,
        errorMessage: "Credentials not configured in environment.",
      };
    }

    const testPayload = {
      Keywords: "dress",
      SearchIndex: "Apparel",
      ItemCount: 3,
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "ItemInfo.ByLineInfo",
        "Offers.Listings.Price",
      ],
      PartnerTag: this.partnerTag,
      PartnerType: "Associates",
      Marketplace: this.host.includes(".in") ? "www.amazon.in" : "www.amazon.com",
    };

    const payloadString = JSON.stringify(testPayload);
    const targetHeader = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

    try {
      const sigV4 = generateAwsSigV4Headers({
        accessKey: this.accessKey,
        secretKey: this.secretKey,
        region: this.region,
        service: "ProductAdvertisingAPI",
        host: this.host,
        path: "/paapi5/searchitems",
        payloadString,
        targetHeader,
      });

      const response = await fetch(`https://${this.host}/paapi5/searchitems`, {
        method: "POST",
        headers: sigV4.headers,
        body: payloadString,
      });

      const latency = Date.now() - start;
      this.lastCheckedTimestamp = new Date().toISOString();

      if (response.status === 200) {
        const data = await response.json();
        const items = data.SearchResult?.Items || [];
        this.lastKnownStatus = "healthy";

        const sample = items[0]
          ? {
              id: items[0].ASIN,
              title: items[0].ItemInfo?.Title?.DisplayValue || "Amazon Product",
              price: items[0].Offers?.Listings?.[0]?.Price?.Amount || 0,
              imageUrl: items[0].Images?.Primary?.Large?.URL || "",
              productUrl: items[0].DetailPageURL || "",
            }
          : null;

        return {
          provider: "Amazon",
          passed: true,
          status: "healthy",
          statusCode: 200,
          latencyMs: latency,
          productCount: items.length,
          sampleProduct: sample,
        };
      }

      if (response.status === 401 || response.status === 403) {
        this.lastKnownStatus = "credentials_invalid";
        return {
          provider: "Amazon",
          passed: false,
          status: "credentials_invalid",
          statusCode: response.status,
          latencyMs: latency,
          productCount: 0,
          errorMessage: `Authentication failed (HTTP ${response.status}): Check AWS Access Key, Secret Key, and Partner Tag.`,
        };
      }

      if (response.status === 429) {
        this.lastKnownStatus = "rate_limited";
        return {
          provider: "Amazon",
          passed: false,
          status: "rate_limited",
          statusCode: 429,
          latencyMs: latency,
          productCount: 0,
          errorMessage: "Amazon PA-API rate limit reached.",
        };
      }

      this.lastKnownStatus = "temporarily_unavailable";
      return {
        provider: "Amazon",
        passed: false,
        status: "temporarily_unavailable",
        statusCode: response.status,
        latencyMs: latency,
        productCount: 0,
        errorMessage: `Unexpected Amazon response status: ${response.status}`,
      };
    } catch (err: any) {
      this.lastKnownStatus = "temporarily_unavailable";
      this.lastCheckedTimestamp = new Date().toISOString();
      return {
        provider: "Amazon",
        passed: false,
        status: "temporarily_unavailable",
        latencyMs: Date.now() - start,
        productCount: 0,
        errorMessage: err.message || "Network error communicating with Amazon PA-API.",
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
    const maxPrice = filters?.maxPrice || query.budget?.max;

    const payload = {
      Keywords: keywords,
      SearchIndex: "Apparel",
      ItemCount: 10,
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "ItemInfo.ByLineInfo",
        "ItemInfo.Classifications",
        "ItemInfo.Features",
        "Offers.Listings.Price",
        "Offers.Listings.DeliveryInfo.IsPrimeEligible",
        "CustomerReviews.StarRating",
        "CustomerReviews.Count",
      ],
      MinPrice: filters?.minPrice ? Math.round(filters.minPrice * 100) : undefined,
      MaxPrice: maxPrice ? Math.round(maxPrice * 100) : undefined,
      SortBy:
        filters?.sortBy === "price_low"
          ? "Price:LowToHigh"
          : filters?.sortBy === "price_high"
          ? "Price:HighToLow"
          : filters?.sortBy === "rating"
          ? "AvgCustomerReviews"
          : "Relevance",
      PartnerTag: this.partnerTag,
      PartnerType: "Associates",
      Marketplace: this.host.includes(".in") ? "www.amazon.in" : "www.amazon.com",
    };

    const payloadString = JSON.stringify(payload);
    const targetHeader = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

    try {
      const sigV4 = generateAwsSigV4Headers({
        accessKey: this.accessKey,
        secretKey: this.secretKey,
        region: this.region,
        service: "ProductAdvertisingAPI",
        host: this.host,
        path: "/paapi5/searchitems",
        payloadString,
        targetHeader,
      });

      const response = await fetch(`https://${this.host}/paapi5/searchitems`, {
        method: "POST",
        headers: sigV4.headers,
        body: payloadString,
      });

      this.lastCheckedTimestamp = new Date().toISOString();

      if (response.ok) {
        this.lastKnownStatus = "healthy";
        const data = await response.json();
        if (!data.SearchResult?.Items || !Array.isArray(data.SearchResult.Items)) {
          return [];
        }

        return data.SearchResult.Items.map((item: any) =>
          this.normalizeAmazonItem(item, query, filters)
        ).filter((p: MarketplaceProduct | null): p is MarketplaceProduct => p !== null);
      }

      if (response.status === 401 || response.status === 403) {
        this.lastKnownStatus = "credentials_invalid";
        console.warn(`[AmazonMarketplaceProvider] Authentication failed (HTTP ${response.status})`);
      } else if (response.status === 429) {
        this.lastKnownStatus = "rate_limited";
        console.warn("[AmazonMarketplaceProvider] Rate limited (HTTP 429)");
      } else {
        this.lastKnownStatus = "temporarily_unavailable";
        console.warn(`[AmazonMarketplaceProvider] API HTTP ${response.status}: ${response.statusText}`);
      }

      return [];
    } catch (err) {
      this.lastKnownStatus = "temporarily_unavailable";
      console.warn("[AmazonMarketplaceProvider] Fetch error:", err);
      return [];
    }
  }

  private normalizeAmazonItem(
    item: any,
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters
  ): MarketplaceProduct | null {
    const asin = item.ASIN;
    const title = item.ItemInfo?.Title?.DisplayValue;
    const imageUrl = item.Images?.Primary?.Large?.URL;
    const productUrl = item.DetailPageURL;

    // Reject items lacking essential product identity
    if (!asin || !title || !imageUrl || !productUrl) {
      return null;
    }

    const priceAmount = item.Offers?.Listings?.[0]?.Price?.Amount;
    const price = typeof priceAmount === "number" ? priceAmount : 0;
    const savingAmount = item.Offers?.Listings?.[0]?.Price?.Savings?.Amount;
    const originalPrice = savingAmount ? price + savingAmount : null;
    const discountPercent =
      originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : null;

    const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || null;
    const rating = item.CustomerReviews?.StarRating?.Value || null;
    const reviewCount = item.CustomerReviews?.Count || null;
    const isPrime = item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible;
    const deliveryInformation = isPrime ? "Prime FREE Delivery" : null;

    return {
      id: asin,
      provider: "Amazon",
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
      availability: "In Stock",
      deliveryInformation,
    };
  }
}

export const amazonMarketplaceProvider = new AmazonMarketplaceProvider();
