import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceProviderName,
  MarketplaceProviderStatus,
  MarketplaceProviderTestResult,
} from "@/types/marketplace";
import { IMarketplaceProvider } from "./MarketplaceProvider";
import { serpApiProvider } from "./SerpApiProvider";
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
    this.registerProvider(serpApiProvider);
    this.registerProvider(amazonMarketplaceProvider);
    this.registerProvider(flipkartMarketplaceProvider);
    this.registerProvider(localCatalogProvider);
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
  public getActiveProviders(sourceFilter?: string): IMarketplaceProvider[] {
    const isSerpApiConfigured = serpApiProvider.isConfigured();
    const isAmazonEnabled = process.env.AMAZON_ENABLED === "true" || amazonMarketplaceProvider.isConfigured();
    const isFlipkartEnabled = process.env.FLIPKART_ENABLED === "true" || flipkartMarketplaceProvider.isConfigured();
    const isLocalEnabled = process.env.MARKETPLACE_LOCAL_ENABLED !== "false";

    const activeList: IMarketplaceProvider[] = [];

    // Primary live product provider
    if (isSerpApiConfigured) {
      activeList.push(serpApiProvider);
    }
    if (isAmazonEnabled && amazonMarketplaceProvider.isConfigured()) {
      activeList.push(amazonMarketplaceProvider);
    }
    if (isFlipkartEnabled && flipkartMarketplaceProvider.isConfigured()) {
      activeList.push(flipkartMarketplaceProvider);
    }

    // If local catalog is enabled or no external providers are configured
    if (isLocalEnabled) {
      activeList.push(localCatalogProvider);
    }

    // Fallback: If no provider is in the list, include local catalog
    if (activeList.length === 0) {
      activeList.push(localCatalogProvider);
    }

    if (!sourceFilter || sourceFilter === "All") {
      return activeList;
    }

    const matched = activeList.filter((p) => p.name.toLowerCase() === sourceFilter.toLowerCase());
    return matched.length > 0 ? matched : activeList;
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

