import {
  MarketplaceProduct,
  MarketplaceSearchFilters,
  MarketplaceSearchResponse,
  MarketplaceProviderStatus,
  MarketplaceProviderTestResult,
  SavedMarketplaceProduct,
} from "@/types/marketplace";
import { AppStorage } from "@/lib/storage";

export const marketplaceService = {
  /**
   * Searches marketplace products across Local Catalog, Amazon & Flipkart with OP AI hybrid retrieval
   */
  search: async (
    query: string,
    filters?: MarketplaceSearchFilters,
    signal?: AbortSignal
  ): Promise<MarketplaceSearchResponse> => {
    const activeUserId = AppStorage.getActiveUserId();

    const res = await fetch("/api/v1/marketplace/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        filters,
        userId: activeUserId,
      }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Marketplace search failed with status ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Failed to fetch marketplace products");
    }

    return json.data as MarketplaceSearchResponse;
  },

  /**
   * Fetches the current health & connection status of all marketplace providers
   */
  getProviderStatus: async (): Promise<{
    providers: MarketplaceProviderStatus[];
    hasConnectedProviders: boolean;
  }> => {
    const res = await fetch("/api/v1/marketplace/providers/status");
    if (!res.ok) {
      throw new Error(`Failed to fetch provider status (${res.status})`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Runs an active live diagnostic test against all configured providers
   */
  testProviders: async (): Promise<{
    summary: string;
    anyConnected: boolean;
    results: {
      amazon: MarketplaceProviderTestResult;
      flipkart: MarketplaceProviderTestResult;
      local?: MarketplaceProviderTestResult;
    };
  }> => {
    const res = await fetch("/api/v1/marketplace/providers/test", {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`Diagnostic test failed with status ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * User-Isolated Saved Marketplace Products
   */
  getSavedProducts: (userId?: string): SavedMarketplaceProduct[] => {
    const uid = userId || AppStorage.getActiveUserId() || "";
    return AppStorage.getSavedProducts(uid);
  },

  saveProduct: (product: MarketplaceProduct, userId?: string): void => {
    const uid = userId || AppStorage.getActiveUserId() || "";
    AppStorage.saveMarketplaceProduct(uid, product);
  },

  removeSavedProduct: (productId: string, userId?: string): void => {
    const uid = userId || AppStorage.getActiveUserId() || "";
    AppStorage.removeSavedMarketplaceProduct(uid, productId);
  },

  isProductSaved: (productId: string, userId?: string): boolean => {
    const uid = userId || AppStorage.getActiveUserId() || "";
    return AppStorage.isProductSaved(uid, productId);
  },
};
