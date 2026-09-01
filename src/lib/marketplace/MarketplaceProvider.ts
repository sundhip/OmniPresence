import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceProviderName,
  MarketplaceProviderStatus,
  MarketplaceProviderTestResult,
  MarketplaceProviderHealthStatus,
} from "@/types/marketplace";

/**
 * Standardized Marketplace Provider Interface
 * All providers (Local, Amazon, Flipkart) normalize products into this contract.
 */
export interface IMarketplaceProvider {
  readonly name: MarketplaceProviderName;
  readonly status: MarketplaceProviderHealthStatus;
  isConfigured(): boolean;
  getStatus(): MarketplaceProviderStatus;
  testConnection(): Promise<MarketplaceProviderTestResult>;
  searchProducts(
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters,
    signal?: AbortSignal
  ): Promise<MarketplaceProduct[]>;
  getProduct?(id: string): Promise<MarketplaceProduct | null>;
  getCategories?(): Promise<string[]>;
  generateAffiliateUrl?(product: MarketplaceProduct): string;
}
