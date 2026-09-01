export type MarketplaceProviderName = "Local" | "Amazon" | "Flipkart";

export type MarketplaceProviderHealthStatus =
  | "ACTIVE"
  | "DISABLED"
  | "UNAVAILABLE"
  | "ERROR"
  | "healthy"
  | "not_configured"
  | "credentials_invalid"
  | "rate_limited"
  | "temporarily_unavailable";

export type ProductAvailability =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "unknown"
  | "In Stock"
  | "Low Stock"
  | "Out of Stock"
  | "Available";

export type PriceStatus = "live" | "cached" | "development";

export interface MarketplaceProduct {
  id: string;
  provider: MarketplaceProviderName;
  providerProductId?: string;
  title: string;
  description?: string;
  brand: string | null;
  imageUrl: string;
  additionalImages?: string[];
  productUrl: string;
  affiliateUrl?: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  discountPercent: number | null;
  discountPercentage?: number | null;
  priceStatus?: PriceStatus;
  rating: number | null;
  reviewCount: number | null;
  availability?: ProductAvailability | null;
  category: string;
  subcategory?: string | null;
  colors?: string[];
  sizes?: string[];
  material?: string | null;
  pattern?: string | null;
  fit?: string | null;
  style?: string | null;
  occasion?: string | null;
  season?: string | null;
  gender?: "Women" | "Men" | "Unisex" | "All" | null;
  source?: "local" | "amazon" | "flipkart";
  deliveryInformation?: string | null;
  isBestSeller?: boolean;
  relevanceScore?: number;
  personalizedScore?: number;
  features?: string[];
  metadata?: Record<string, any>;
  embedding?: number[];
  fashionEmbedding?: number[];
  confidence?: number;
  lastUpdated?: string;

  // AI Recommendation & Wardrobe Synthesis
  wardrobeCompatibilityScore?: number;
  needScore?: number;
  needVerdict?: "Essential Addition" | "Versatile Match" | "High Redundancy" | "Budget Alert";
  recommendationReason?: string;
  scores?: {
    semanticScore?: number;
    visualScore?: number;
    wardrobeScore?: number;
    preferenceScore?: number;
    occasionScore?: number;
    budgetScore?: number;
    duplicatePenalty?: number;
    finalScore?: number;
  };
}

export interface FashionParsedQuery {
  rawQuery: string;
  category?: string;
  subcategory?: string;
  style?: string;
  color?: string;
  pattern?: string;
  fit?: string;
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
  imageSearch?: boolean;
  imageFeatures?: {
    dominantColor?: string;
    detectedCategory?: string;
    detectedFit?: string;
  };
}

export interface MarketplaceSearchFilters {
  source?: "All" | "Local" | "Amazon" | "Flipkart";
  gender?: "Women" | "Men" | "All";
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  selectedStyles?: string[];
  selectedColors?: string[];
  selectedBrands?: string[];
  selectedFits?: string[];
  selectedOccasions?: string[];
  sortBy?: "best_match" | "best_for_you" | "price_low" | "price_high" | "rating" | "wardrobe_match";
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

export interface SavedMarketplaceProduct {
  id: string;
  userId: string;
  product: MarketplaceProduct;
  savedAt: string;
}
