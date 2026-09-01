import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceProviderName,
  MarketplaceProviderStatus,
  MarketplaceProviderTestResult,
} from "@/types/marketplace";
import { IMarketplaceProvider } from "./MarketplaceProvider";
import { localCatalogProvider } from "./LocalCatalogProvider";
import { amazonMarketplaceProvider } from "./AmazonMarketplaceProvider";
import { flipkartMarketplaceProvider } from "./FlipkartMarketplaceProvider";

/**
 * Marketplace Provider Registry
 * Coordinates discovery, priority, health monitoring, and multi-provider searches.
 */
export class MarketplaceProviderRegistry {
  private providers: Map<MarketplaceProviderName, IMarketplaceProvider> = new Map();

  constructor() {
    this.registerProvider(localCatalogProvider);
    this.registerProvider(amazonMarketplaceProvider);
    this.registerProvider(flipkartMarketplaceProvider);
  }

  public registerProvider(provider: IMarketplaceProvider): void {
    this.providers.set(provider.name, provider);
  }

  public getProvider(name: MarketplaceProviderName): IMarketplaceProvider | undefined {
    return this.providers.get(name);
  }

  public getAllProviders(): IMarketplaceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Returns providers that are enabled and ready to accept queries.
   */
  public getActiveProviders(sourceFilter?: "All" | "Local" | "Amazon" | "Flipkart"): IMarketplaceProvider[] {
    const isLocalEnabled = process.env.MARKETPLACE_LOCAL_ENABLED !== "false";
    const isAmazonEnabled = process.env.AMAZON_ENABLED === "true" || amazonMarketplaceProvider.isConfigured();
    const isFlipkartEnabled = process.env.FLIPKART_ENABLED === "true" || flipkartMarketplaceProvider.isConfigured();

    const activeList: IMarketplaceProvider[] = [];

    if (isLocalEnabled) {
      activeList.push(localCatalogProvider);
    }
    if (isAmazonEnabled && amazonMarketplaceProvider.isConfigured()) {
      activeList.push(amazonMarketplaceProvider);
    }
    if (isFlipkartEnabled && flipkartMarketplaceProvider.isConfigured()) {
      activeList.push(flipkartMarketplaceProvider);
    }

    // Fallback: If no external provider is configured, always ensure local catalog is active
    if (activeList.length === 0) {
      activeList.push(localCatalogProvider);
    }

    if (!sourceFilter || sourceFilter === "All") {
      return activeList;
    }

    return activeList.filter((p) => p.name.toLowerCase() === sourceFilter.toLowerCase());
  }

  public getProviderStatuses(): MarketplaceProviderStatus[] {
    return this.getAllProviders().map((p) => p.getStatus());
  }

  public async testAllProviders(): Promise<MarketplaceProviderTestResult[]> {
    const results: MarketplaceProviderTestResult[] = [];
    for (const provider of this.getAllProviders()) {
      try {
        const res = await provider.testConnection();
        results.push(res);
      } catch (err: any) {
        results.push({
          provider: provider.name,
          passed: false,
          status: "ERROR",
          latencyMs: 0,
          productCount: 0,
          errorMessage: err.message || "Test connection failed",
        });
      }
    }
    return results;
  }
}

export const marketplaceProviderRegistry = new MarketplaceProviderRegistry();
