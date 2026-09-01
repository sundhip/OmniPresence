export type MarketplaceProviderName = "Amazon" | "Flipkart";

export type MarketplaceProviderHealthStatus =
  | "healthy"
  | "not_configured"
  | "credentials_invalid"
  | "rate_limited"
  | "temporarily_unavailable";

export interface MarketplaceProduct {
  id: string;
  provider: MarketplaceProviderName;
  title: string;
  brand: string | null;
  imageUrl: string;
  productUrl: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  discountPercent: number | null;
  rating: number | null;
  reviewCount: number | null;
  category: string;
  subcategory?: string | null;
  style?: string | null;
  gender?: "Women" | "Men" | "Unisex" | "All" | null;
  colors?: string[];
  availability?: "In Stock" | "Low Stock" | "Out of Stock" | "Available" | null;
  deliveryInformation?: string | null;
  isBestSeller?: boolean;
  relevanceScore?: number;
  personalizedScore?: number;
  features?: string[];
}

export interface FashionParsedQuery {
  rawQuery: string;
  category?: string;
  subcategory?: string;
  style?: string;
  color?: string;
  pattern?: string;
  occasion?: string;
  season?: string;
  gender?: "Women" | "Men" | "Unisex" | "All";
  budget?: {
    min?: number;
    max?: number;
  };
  comfortPriority?: boolean;
  discoveredStyles: string[];
  searchKeywords: string;
}

export interface MarketplaceSearchFilters {
  source?: "All" | "Amazon" | "Flipkart";
  gender?: "Women" | "Men" | "All";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  selectedStyles?: string[];
  selectedColors?: string[];
  selectedBrands?: string[];
  sortBy?: "best_match" | "best_for_you" | "price_low" | "price_high" | "rating";
}

export interface MarketplaceProviderStatus {
  provider: MarketplaceProviderName;
  isConfigured: boolean;
  isConnected: boolean;
  status: MarketplaceProviderHealthStatus;
  message: string;
  lastChecked?: string;
  details?: {
    host?: string;
    region?: string;
    partnerTagMasked?: string;
    affiliateIdMasked?: string;
  };
}

export interface MarketplaceProviderTestResult {
  provider: MarketplaceProviderName;
  passed: boolean;
  status: MarketplaceProviderHealthStatus;
  latencyMs: number;
  statusCode?: number;
  productCount: number;
  sampleProduct?: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    productUrl: string;
  } | null;
  errorMessage?: string;
}

export interface MarketplaceSearchResponse {
  query: FashionParsedQuery;
  totalProducts: number;
  products: MarketplaceProduct[];
  sections: {
    bestMatch: MarketplaceProduct[];
    bestForYou: MarketplaceProduct[];
    costEffective: MarketplaceProduct[];
    highestRated: MarketplaceProduct[];
  };
  discoveredStyles: string[];
  availableBrands: string[];
  availableColors: string[];
  priceRange: {
    min: number;
    max: number;
  };
  providerStatuses: MarketplaceProviderStatus[];
  hasConnectedProviders: boolean;
}
