import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceProviderName,
  MarketplaceProviderStatus,
  MarketplaceProviderTestResult,
} from "@/types/marketplace";

export interface IMarketplaceProvider {
  readonly name: MarketplaceProviderName;
  isConfigured(): boolean;
  getStatus(): MarketplaceProviderStatus;
  testConnection(): Promise<MarketplaceProviderTestResult>;
  searchProducts(
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters
  ): Promise<MarketplaceProduct[]>;
}
