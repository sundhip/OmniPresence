"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceSearchResponse,
} from "@/types/marketplace";
import { marketplaceService } from "@/services/marketplaceService";
import { wardrobeService } from "@/services/wardrobeService";
import { financeService } from "@/services/financeService";
import { PurchaseEvaluation } from "@/types/finance";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Search,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Star,
  Check,
  Tag,
  Truck,
  RotateCcw,
  Heart,
  PlusCircle,
  X,
  AlertCircle,
} from "lucide-react";

const SUGGESTED_SEARCHES = [
  "Dress",
  "Floral Maxi Dress",
  "White Shirt",
  "Black dress under ₹2000",
  "Dress for wedding",
  "Casual shirt",
  "Black jeans",
  "Sneakers under ₹3000",
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [searchQuery, setSearchQuery] = useState("Dress");
  const [activeQuery, setActiveQuery] = useState<FashionParsedQuery | null>(null);
  const [searchResponse, setSearchResponse] = useState<MarketplaceSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Active Section Tab
  const [activeSection, setActiveSection] = useState<
    "bestMatch" | "bestForYou" | "costEffective" | "highestRated"
  >("bestMatch");

  // Filters State
  const [sourceFilter, setSourceFilter] = useState<"All" | "Amazon" | "Flipkart">("All");
  const [genderFilter, setGenderFilter] = useState<"Women" | "Men" | "All">(
    (user?.gender as "Women" | "Men" | "All") || "Women"
  );
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"best_match" | "best_for_you" | "price_low" | "price_high" | "rating">(
    "best_match"
  );

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);
  const [isAddingToWardrobe, setIsAddingToWardrobe] = useState(false);
  const [evalResult, setEvalResult] = useState<PurchaseEvaluation | null>(null);
  const [isEvaluatingProduct, setIsEvaluatingProduct] = useState(false);

  // Stale Request Protection
  const activeAbortController = useRef<AbortController | null>(null);
  const searchRequestId = useRef(0);

  // Execute Search
  const executeSearch = async (
    queryText: string,
    stylesOverride?: string[],
    sourceOverride?: "All" | "Amazon" | "Flipkart",
    genderOverride?: "Women" | "Men" | "All",
    priceOverride?: number,
    colorOverride?: string
  ) => {
    // Cancel in-flight request
    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    const abortController = new AbortController();
    activeAbortController.current = abortController;

    const currentReqId = ++searchRequestId.current;
    setIsLoading(true);

    try {
      const filters: MarketplaceSearchFilters = {
        source: sourceOverride || sourceFilter,
        gender: genderOverride || genderFilter,
        selectedStyles: stylesOverride !== undefined ? stylesOverride : selectedStyles,
        maxPrice: priceOverride !== undefined ? priceOverride : maxPrice,
        selectedColors: colorOverride ? [colorOverride] : selectedColor ? [selectedColor] : undefined,
        sortBy,
      };

      const response = await marketplaceService.search(queryText, filters, abortController.signal);

      // Protect against stale async response overwrites
      if (currentReqId !== searchRequestId.current) {
        return;
      }

      setSearchResponse(response);
      setActiveQuery(response.query);

      // Sync extracted query parameters
      if (response.query.style && !selectedStyles.includes(response.query.style)) {
        setSelectedStyles([response.query.style]);
      }
      if (response.query.budget?.max && maxPrice === undefined) {
        setMaxPrice(response.query.budget.max);
      }
      if (response.query.color && !selectedColor) {
        setSelectedColor(response.query.color);
      }
      if (response.query.gender && response.query.gender !== "Unisex") {
        setGenderFilter(response.query.gender as "Women" | "Men" | "All");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      toastError("Search failed", err.message || "Could not fetch marketplace items");
    } finally {
      if (currentReqId === searchRequestId.current) {
        setIsLoading(false);
      }
    }
  };

  // Initial Search on mount
  useEffect(() => {
    const initialGender = (user?.gender as "Women" | "Men" | "All") || "Women";
    setGenderFilter(initialGender);
    const initialQuery = initialGender === "Men" ? "Casual Shirt" : "Dress";
    setSearchQuery(initialQuery);
    executeSearch(initialQuery, undefined, undefined, initialGender);

    return () => {
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }
    };
  }, [user?.gender]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    executeSearch(searchQuery);
  };

  // Style Discovery Click handler
  const handleToggleStyleChip = (styleName: string) => {
    let newStyles: string[] = [];
    if (selectedStyles.includes(styleName)) {
      newStyles = selectedStyles.filter((s) => s !== styleName);
    } else {
      newStyles = [styleName];
    }
    setSelectedStyles(newStyles);
    executeSearch(searchQuery, newStyles);
  };

  // Add Product to Digital Wardrobe
  const handleAddToWardrobe = async (prod: MarketplaceProduct) => {
    setIsAddingToWardrobe(true);
    try {
      await wardrobeService.addItem({
        userId: user?.id || "hero",
        name: prod.title,
        category: (prod.category as any) || "Dresses",
        subcategory: prod.subcategory || prod.style || "Dress",
        color: (prod.colors?.[0] as any) || "Multi",
        brand: prod.brand || "Fashion",
        size: user?.sizes?.tops || "M",
        fit: "Regular",
        occasion: ["Casual Outings", "Everyday"],
        season: ["All-Season"],
        imageUrl: prod.imageUrl,
        notes: `Imported from ${prod.provider} (${prod.currency}${prod.price})`,
        wearCount: 0,
      });
      success("Added to Wardrobe", `${prod.title} is now in your digital wardrobe.`);
      setQuickViewProduct(null);
    } catch (err: any) {
      toastError("Failed to add item", err.message);
    } finally {
      setIsAddingToWardrobe(false);
    }
  };

  // Extract products for the active section
  const currentProducts: MarketplaceProduct[] = searchResponse
    ? searchResponse.sections[activeSection] || []
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header & Provider Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-[var(--primary)]" />
              OP AI Fashion Search & Marketplace
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Explore styles, designs, and real shopping results across connected retail marketplaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF9900]/10 border border-[#FF9900]/30 text-[#FF9900] text-xs font-bold">
            <ShoppingBag className="w-3.5 h-3.5" /> Amazon
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2874F0]/10 border border-[#2874F0]/30 text-[#2874F0] text-xs font-bold">
            <ShoppingBag className="w-3.5 h-3.5" /> Flipkart
          </span>
        </div>
      </div>

      {/* Clean Natural Language Search Bar (No dead camera/upload buttons) */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dresses, shirts, jeans, shoes, occasions (e.g. 'Floral maxi dress', 'White shirt', 'Dress for wedding')..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all font-medium"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md min-h-[46px]"
          >
            Search OP AI
          </Button>
        </form>

        {/* Suggested Quick Searches */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">
            Try:
          </span>
          {SUGGESTED_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setSearchQuery(term);
                executeSearch(term);
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>

        {/* OP AI Understanding Banner */}
        {activeQuery && (
          <div className="p-3.5 rounded-2xl bg-[var(--primary-soft)]/50 border border-[var(--primary)]/20 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[var(--primary)] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> OP AI Understood:
              </span>
              {activeQuery.gender && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Focus: {activeQuery.gender === "All" ? "All Collections" : `${activeQuery.gender}'s Fashion`}
                </span>
              )}
              {activeQuery.category && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Category: {activeQuery.category}
                </span>
              )}
              {activeQuery.style && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Style: {activeQuery.style}
                </span>
              )}
              {activeQuery.color && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Color: {activeQuery.color}
                </span>
              )}
              {activeQuery.pattern && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Pattern: {activeQuery.pattern}
                </span>
              )}
              {activeQuery.occasion && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Occasion: {activeQuery.occasion}
                </span>
              )}
              {activeQuery.budget?.max && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Budget: ≤ ₹{activeQuery.budget.max}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STYLE DISCOVERY SECTION (Refinements, not fake products) */}
      {searchResponse && searchResponse.discoveredStyles.length > 0 && (
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {activeQuery?.category || "Fashion"} Styles & Design Variations
              </h3>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Click any style to refine search intent
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {searchResponse.discoveredStyles.map((style) => {
              const isSelected = selectedStyles.includes(style);
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleToggleStyleChip(style)}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    isSelected
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md"
                      : "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
                >
                  <span>{style}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        {/* Gender Focus Toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase mr-1">Focus:</span>
          {[
            { id: "Women", label: "Women" },
            { id: "Men", label: "Men" },
            { id: "All", label: "All" },
          ].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setGenderFilter(g.id as any);
                executeSearch(searchQuery, undefined, undefined, g.id as any);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                genderFilter === g.id
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                  : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Marketplace Source Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase mr-1">Marketplace:</span>
          {(["All", "Amazon", "Flipkart"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSourceFilter(s);
                executeSearch(searchQuery, undefined, s);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                sourceFilter === s
                  ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]"
                  : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Price Bracket Quick Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase mr-1">Price:</span>
          {[
            { label: "All", val: undefined },
            { label: "< ₹1000", val: 1000 },
            { label: "< ₹2000", val: 2000 },
            { label: "< ₹3500", val: 3500 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setMaxPrice(p.val);
                executeSearch(searchQuery, undefined, undefined, undefined, p.val);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                maxPrice === p.val
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold"
                  : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION TABS (Only genuine, supported partitions) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
        {[
          { id: "bestMatch", label: "Best Match", icon: <Sparkles className="w-4 h-4" /> },
          { id: "bestForYou", label: "Best For You (✦ OP AI)", icon: <Heart className="w-4 h-4 text-pink-500" /> },
          { id: "costEffective", label: "Price: Low to High", icon: <Tag className="w-4 h-4 text-green-500" /> },
          { id: "highestRated", label: "Highest Rated", icon: <Star className="w-4 h-4 text-amber-500" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSection === tab.id
                ? "bg-[var(--primary)] text-white shadow-md"
                : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] border border-[var(--border)]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* PRODUCT GRID DISPLAY */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-80 rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-4 space-y-3"
            >
              <div className="w-full h-48 rounded-2xl bg-[var(--surface-soft)]" />
              <div className="w-3/4 h-4 rounded-full bg-[var(--surface-soft)]" />
              <div className="w-1/2 h-4 rounded-full bg-[var(--surface-soft)]" />
            </div>
          ))}
        </div>
      ) : currentProducts.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <ShoppingBag className="w-8 h-8" />
          </div>

          {(() => {
            const statuses = searchResponse?.providerStatuses || [];
            const anyConfigured = statuses.some((s) => s.isConfigured);
            const anyConnected = statuses.some((s) => s.isConnected);
            const invalidCreds = statuses.filter((s) => s.status === "credentials_invalid");
            const rateLimited = statuses.filter((s) => s.status === "rate_limited");

            if (!anyConfigured) {
              return (
                <div className="space-y-3 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[var(--primary)]" />
                    Shopping Providers Not Configured
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Connect an official retail shopping provider (Amazon PA-API 5.0 or Flipkart Affiliate) to enable live shopping search.
                  </p>
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] text-left text-xs space-y-2">
                    <span className="font-bold text-[var(--text-primary)] block">To activate live shopping:</span>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Add AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG or FLIPKART_AFFILIATE_ID to .env.local
                    </p>
                  </div>
                </div>
              );
            }

            if (invalidCreds.length > 0 && !anyConnected) {
              return (
                <div className="space-y-3 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-[var(--error)] flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {invalidCreds.map((p) => p.provider).join(" & ")} Authentication Failed
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    The configured credentials for {invalidCreds.map((p) => p.provider).join(" and ")} were rejected by the provider API. Please verify your API keys and Partner Tag.
                  </p>
                </div>
              );
            }

            if (rateLimited.length > 0 && !anyConnected) {
              return (
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Shopping Provider Rate Limited
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    API request quota reached for {rateLimited.map((p) => p.provider).join(" and ")}. Please wait a moment and search again.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  No {activeQuery?.category?.toLowerCase() || "products"} found matching &quot;{searchQuery}&quot;
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Try selecting a different style variation, adjusting your budget, or clearing active filters.
                </p>
              </div>
            );
          })()}

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStyles([]);
                setMaxPrice(undefined);
                setSourceFilter("All");
                executeSearch(searchQuery, [], "All", undefined, undefined);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map((prod) => (
            <div
              key={`${prod.provider}-${prod.id}`}
              className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] shadow-[var(--shadow-card)] hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Image & Source Badge */}
              <div className="relative aspect-[3/4] overflow-hidden bg-black/5">
                <img
                  src={prod.imageUrl}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Source Badge (Amazon vs Flipkart) */}
                <div className="absolute top-3 left-3">
                  {prod.provider === "Amazon" ? (
                    <span className="px-2.5 py-1 rounded-xl bg-black/80 text-[#FF9900] text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-[#FF9900]/40 shadow-sm flex items-center gap-1">
                      Amazon
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-[#2874F0] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      Flipkart
                    </span>
                  )}
                </div>

                {/* Discount Tag */}
                {prod.discountPercent && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-[var(--error)] text-white text-[10px] font-bold shadow-sm">
                    {prod.discountPercent}% OFF
                  </div>
                )}

                {/* Quick View Button on Hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(prod)}
                    className="py-2 px-4 rounded-xl bg-white text-black text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                  >
                    Quick Details
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="font-bold text-[var(--text-primary)]">{prod.brand || prod.provider}</span>
                    {prod.rating && (
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        {prod.rating}
                        {prod.reviewCount && (
                          <span className="text-[10px] text-[var(--text-muted)]">({prod.reviewCount})</span>
                        )}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-[var(--text-primary)] line-clamp-2 leading-snug">
                    {prod.title}
                  </h4>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  {/* Pricing */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-[var(--text-primary)]">
                      {prod.currency}
                      {prod.price}
                    </span>
                    {prod.originalPrice && (
                      <span className="text-xs text-[var(--text-muted)] line-through">
                        {prod.currency}
                        {prod.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Delivery Signal */}
                  {prod.deliveryInformation && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)]">
                      <Truck className="w-3 h-3 text-[var(--primary)] flex-shrink-0" />
                      <span className="line-clamp-1">{prod.deliveryInformation}</span>
                    </div>
                  )}

                  {/* Outward Affiliate Link */}
                  <div className="flex items-center gap-2 pt-1">
                    {prod.productUrl ? (
                      <a
                        href={prod.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                          prod.provider === "Amazon"
                            ? "bg-[#FF9900] text-black hover:opacity-90"
                            : "bg-[#2874F0] text-white hover:opacity-90"
                        }`}
                      >
                        Buy on {prod.provider} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleAddToWardrobe(prod)}
                      className="p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] hover:text-[var(--primary)] transition-all cursor-pointer"
                      title="Add to My Wardrobe"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      <Modal
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.title || "Product Details"}
        size="2xl"
      >
        {quickViewProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-black/5">
                <img
                  src={quickViewProduct.imageUrl}
                  alt={quickViewProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-lg text-white ${
                      quickViewProduct.provider === "Amazon" ? "bg-[#FF9900] text-black" : "bg-[#2874F0]"
                    }`}
                  >
                    {quickViewProduct.provider}
                  </span>
                  <span className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    {quickViewProduct.brand || quickViewProduct.provider}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-[var(--text-primary)]">
                    {quickViewProduct.currency}
                    {quickViewProduct.price}
                  </span>
                  {quickViewProduct.originalPrice && (
                    <span className="text-sm text-[var(--text-muted)] line-through">
                      {quickViewProduct.currency}
                      {quickViewProduct.originalPrice}
                    </span>
                  )}
                  {quickViewProduct.discountPercent && (
                    <span className="text-xs font-bold text-[var(--error)] bg-red-500/10 px-2 py-0.5 rounded-md">
                      {quickViewProduct.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Features */}
                {quickViewProduct.features && quickViewProduct.features.length > 0 && (
                  <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="font-bold text-[var(--text-primary)] block">Highlights:</span>
                    {quickViewProduct.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Do I Need This Evaluation Result */}
                {evalResult && (
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Verdict: {evalResult.verdict}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                      {evalResult.explanation}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!quickViewProduct) return;
                      setIsEvaluatingProduct(true);
                      try {
                        const ev = await financeService.evaluatePurchase(
                          quickViewProduct.title,
                          quickViewProduct.price,
                          quickViewProduct.category || "Clothing",
                          quickViewProduct.colors?.[0]
                        );
                        setEvalResult(ev);
                      } catch (err: any) {
                        toastError("Evaluation Error", err.message);
                      } finally {
                        setIsEvaluatingProduct(false);
                      }
                    }}
                    isLoading={isEvaluatingProduct}
                    className="w-full sm:w-auto text-xs"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />}
                  >
                    Do I Need This?
                  </Button>

                  {quickViewProduct.productUrl && (
                    <a
                      href={quickViewProduct.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md ${
                        quickViewProduct.provider === "Amazon"
                          ? "bg-[#FF9900] text-black"
                          : "bg-[#2874F0] text-white"
                      }`}
                    >
                      View on {quickViewProduct.provider} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => handleAddToWardrobe(quickViewProduct)}
                    disabled={isAddingToWardrobe}
                    className="w-full sm:w-auto py-2.5 px-3 text-xs font-bold"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
