"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceSearchResponse,
  SavedMarketplaceProduct,
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
  Camera,
  Layers,
  ShieldAlert,
  CheckCircle2,
  Bookmark,
} from "lucide-react";

const SUGGESTED_SEARCHES = [
  "Linen Shirt",
  "Oversized Black T-Shirt",
  "Floral Maxi Dress",
  "Tailored Navy Chinos",
  "White Leather Sneakers",
  "Charcoal Wool Blazer",
  "Slim Jeans under ₹2000",
  "Wedding guest dress",
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [searchQuery, setSearchQuery] = useState("Linen Shirt");
  const [activeQuery, setActiveQuery] = useState<FashionParsedQuery | null>(null);
  const [searchResponse, setSearchResponse] = useState<MarketplaceSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Active Section Tab
  const [activeSection, setActiveSection] = useState<
    "bestMatch" | "bestForYou" | "costEffective" | "highestRated" | "saved"
  >("bestMatch");

  // Saved Products State (User-Isolated)
  const [savedProducts, setSavedProducts] = useState<SavedMarketplaceProduct[]>([]);

  // Filters State
  const [sourceFilter, setSourceFilter] = useState<"All" | "Local" | "Amazon" | "Flipkart">("All");
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

  // Image Search Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stale Request Protection
  const activeAbortController = useRef<AbortController | null>(null);
  const searchRequestId = useRef(0);

  // Refresh saved products for active user
  const reloadSavedProducts = () => {
    if (user?.id) {
      setSavedProducts(marketplaceService.getSavedProducts(user.id));
    }
  };

  useEffect(() => {
    reloadSavedProducts();
  }, [user?.id]);

  // Execute Search
  const executeSearch = async (
    queryText: string,
    stylesOverride?: string[],
    sourceOverride?: "All" | "Local" | "Amazon" | "Flipkart",
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
    const initialQuery = initialGender === "Men" ? "Linen Shirt" : "Floral Maxi Dress";
    setSearchQuery(initialQuery);
    executeSearch(initialQuery, undefined, undefined, initialGender);
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    executeSearch(searchQuery);
  };

  const handleToggleStyleChip = (style: string) => {
    const next = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];
    setSelectedStyles(next);
    executeSearch(searchQuery, next);
  };

  const handleToggleSaved = (prod: MarketplaceProduct) => {
    if (!user?.id) return;
    const isSaved = marketplaceService.isProductSaved(prod.id, user.id);
    if (isSaved) {
      marketplaceService.removeSavedProduct(prod.id, user.id);
      success("Removed from wishlist", `${prod.title} was removed.`);
    } else {
      marketplaceService.saveProduct(prod, user.id);
      success("Saved to wishlist", `${prod.title} was saved to your private wishlist.`);
    }
    reloadSavedProducts();
  };

  const handleAddToWardrobe = async (prod: MarketplaceProduct) => {
    if (!user) return;
    setIsAddingToWardrobe(true);
    try {
      await wardrobeService.addItem({
        userId: user.id,
        name: prod.title,
        category: prod.category as any,
        subcategory: prod.subcategory || prod.category || "General",
        color: prod.colors?.[0] || "Black",
        brand: prod.brand || prod.provider,
        fit: prod.fit || "Regular",
        material: prod.material || undefined,
        season: ["All-Season"],
        occasion: prod.occasion ? [prod.occasion] : ["Casual"],
        wearCount: 0,
        imageUrl: prod.imageUrl,
        notes: `Imported from ${prod.provider} (${prod.currency} ${prod.price})`,
      });
      success("Added to Wardrobe!", `${prod.title} has been cataloged in your digital wardrobe.`);
    } catch (err: any) {
      toastError("Failed to add", err.message || "Could not save to digital wardrobe.");
    } finally {
      setIsAddingToWardrobe(false);
    }
  };

  const handleEvaluatePurchase = async (prod: MarketplaceProduct) => {
    if (!user) return;
    setIsEvaluatingProduct(true);
    setEvalResult(null);
    try {
      const res = await financeService.evaluatePurchase(
        prod.title,
        prod.price,
        prod.category,
        prod.colors?.[0]
      );
      setEvalResult(res);
    } catch (e: any) {
      toastError("Evaluation failed", e.message || "Could not evaluate financial impact");
    } finally {
      setIsEvaluatingProduct(false);
    }
  };

  // Image Upload / Camera search handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate FashionCLIP visual feature extraction
    const detectedColor = "Black";
    const detectedCategory = "Tops";
    const prompt = `Visual search for ${detectedColor} ${detectedCategory}`;
    setSearchQuery(prompt);
    executeSearch(prompt, undefined, undefined, undefined, undefined, detectedColor);
    success("Image Analyzed", "Searching visually similar products with FashionCLIP embeddings.");
  };

  // Compute products to render based on active section
  const currentProducts: MarketplaceProduct[] = (() => {
    if (activeSection === "saved") {
      return savedProducts.map((sp) => sp.product);
    }
    if (!searchResponse) return [];
    return searchResponse.sections[activeSection] || searchResponse.products || [];
  })();

  const activeSavedIds = new Set(savedProducts.map((sp) => sp.product.id));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Hidden image search input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* HEADER & HERO */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-[var(--surface)] via-[var(--surface-soft)] to-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-xs font-bold text-[var(--primary)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OP AI Marketplace & Wardrobe Synthesis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Smart Shopping Intelligence
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Multi-provider retail search with real-time wardrobe compatibility, duplicate protection, and &quot;Do I Need This?&quot; financial synthesis.
          </p>
        </div>
      </div>

      {/* SEARCH BAR & AI UNDERSTANDING */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="E.g., 'White linen shirt', 'Black oversized tee under ₹1500', 'Wedding guest dress'..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] focus:border-[var(--primary)] text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all shadow-xs"
            />
            {/* Camera / Image Search trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all cursor-pointer"
              title="Search with Photo (FashionCLIP Visual Search)"
            >
              <Camera className="w-4 h-4" />
            </button>
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
              {activeQuery.subcategory && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Subcategory: {activeQuery.subcategory}
                </span>
              )}
              {activeQuery.fit && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Fit: {activeQuery.fit}
                </span>
              )}
              {activeQuery.color && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Color: {activeQuery.color}
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

      {/* STYLE DISCOVERY SECTION */}
      {searchResponse && searchResponse.discoveredStyles.length > 0 && (
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {activeQuery?.category || "Fashion"} Style Variations
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
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase mr-1">Provider:</span>
          {(["All", "Local", "Amazon", "Flipkart"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSourceFilter(s);
                executeSearch(searchQuery, undefined, s);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                sourceFilter === s
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                  : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
              }`}
            >
              {s === "Local" ? "Local Catalog" : s}
            </button>
          ))}
        </div>

        {/* Sort Option */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              executeSearch(searchQuery);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] outline-none"
          >
            <option value="best_match">OP AI Best Match</option>
            <option value="best_for_you">Wardrobe Synergy</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        {[
          { id: "bestMatch", label: "Best Match", count: searchResponse?.sections.bestMatch?.length },
          { id: "bestForYou", label: "Wardrobe Synergy", count: searchResponse?.sections.bestForYou?.length },
          { id: "costEffective", label: "Value & Budget", count: searchResponse?.sections.costEffective?.length },
          { id: "highestRated", label: "Top Rated", count: searchResponse?.sections.highestRated?.length },
          { id: "saved", label: "Wishlist", count: savedProducts.length, icon: Bookmark },
        ].map((tab) => {
          const isActive = activeSection === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* PRODUCT GRID */}
      {currentProducts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
          <ShoppingBag className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {activeSection === "saved"
              ? "No saved wishlist items"
              : `No products found matching "${searchQuery}"`}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {activeSection === "saved"
              ? "Click the heart icon on any product to save it to your private wishlist."
              : "Try adjusting your search terms, changing the category, or resetting your active filters."}
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStyles([]);
                setMaxPrice(undefined);
                setSourceFilter("All");
                setActiveSection("bestMatch");
                executeSearch(searchQuery, [], "All", undefined, undefined);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map((prod) => {
            const isSaved = activeSavedIds.has(prod.id);
            return (
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

                  {/* Clean Provider Badge */}
                  <div className="absolute top-3 left-3">
                    {prod.provider === "Amazon" ? (
                      <span className="px-2.5 py-1 rounded-xl bg-black/80 text-[#FF9900] text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-[#FF9900]/40 shadow-sm flex items-center gap-1">
                        Amazon
                      </span>
                    ) : prod.provider === "Flipkart" ? (
                      <span className="px-2.5 py-1 rounded-xl bg-[#2874F0] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        Flipkart
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 text-emerald-400 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-emerald-500/30 shadow-sm flex items-center gap-1">
                        Dev Catalog
                      </span>
                    )}
                  </div>

                  {/* Save to Wishlist Heart Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSaved(prod)}
                    className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                      isSaved
                        ? "bg-rose-500 text-white"
                        : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
                    }`}
                    title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? "fill-white" : ""}`} />
                  </button>

                  {/* Wardrobe Match Overlay Pill */}
                  {prod.wardrobeCompatibilityScore !== undefined && (
                    <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {prod.wardrobeCompatibilityScore}% Wardrobe Match
                      </span>
                      {prod.needVerdict && (
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            prod.needVerdict === "Essential Addition"
                              ? "bg-emerald-500/30 text-emerald-300"
                              : prod.needVerdict === "High Redundancy"
                              ? "bg-rose-500/30 text-rose-300"
                              : "bg-blue-500/30 text-blue-300"
                          }`}
                        >
                          {prod.needVerdict}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick View Button on Hover */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(prod)}
                      className="py-2.5 px-5 rounded-xl bg-white text-black text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                    >
                      View Details & AI Synthesis
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
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-[var(--text-primary)]">
                          ₹{prod.price}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-xs text-[var(--text-muted)] line-through">
                            ₹{prod.originalPrice}
                          </span>
                        )}
                      </div>
                      {prod.priceStatus === "development" && (
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Dev Catalog
                        </span>
                      )}
                    </div>

                    {/* Outward / Wardrobe Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {prod.productUrl ? (
                        <a
                          href={prod.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                            prod.provider === "Amazon"
                              ? "bg-[#FF9900] text-black hover:opacity-90"
                              : prod.provider === "Flipkart"
                              ? "bg-[#2874F0] text-white hover:opacity-90"
                              : "bg-[var(--primary)] text-white hover:opacity-90"
                          }`}
                        >
                          {prod.provider === "Local" ? "View Product" : `Buy on ${prod.provider}`} <ExternalLink className="w-3 h-3" />
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
            );
          })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-black/5 border border-[var(--border)]">
                <img
                  src={quickViewProduct.imageUrl}
                  alt={quickViewProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Information */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                      {quickViewProduct.brand || quickViewProduct.provider} • {quickViewProduct.category}
                    </span>
                    {quickViewProduct.rating && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {quickViewProduct.rating}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-[var(--text-primary)] leading-snug">
                    {quickViewProduct.title}
                  </h3>

                  {quickViewProduct.description && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {quickViewProduct.description}
                    </p>
                  )}

                  {/* Attributes */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                    {quickViewProduct.material && (
                      <div className="p-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Material:</span>
                        <span className="font-bold text-[var(--text-primary)]">{quickViewProduct.material}</span>
                      </div>
                    )}
                    {quickViewProduct.fit && (
                      <div className="p-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Fit:</span>
                        <span className="font-bold text-[var(--text-primary)]">{quickViewProduct.fit}</span>
                      </div>
                    )}
                    {quickViewProduct.style && (
                      <div className="p-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Style:</span>
                        <span className="font-bold text-[var(--text-primary)]">{quickViewProduct.style}</span>
                      </div>
                    )}
                    {quickViewProduct.occasion && (
                      <div className="p-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">Occasion:</span>
                        <span className="font-bold text-[var(--text-primary)]">{quickViewProduct.occasion}</span>
                      </div>
                    )}
                  </div>

                  {/* OP AI Wardrobe Synthesis */}
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" /> Wardrobe Synthesis:
                      </span>
                      <span className="font-black text-emerald-500">
                        {quickViewProduct.wardrobeCompatibilityScore || 85}% Match
                      </span>
                    </div>
                    {quickViewProduct.recommendationReason && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {quickViewProduct.recommendationReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price & Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[var(--text-primary)]">
                      ₹{quickViewProduct.price}
                    </span>
                    {quickViewProduct.originalPrice && (
                      <span className="text-sm text-[var(--text-muted)] line-through">
                        ₹{quickViewProduct.originalPrice}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {quickViewProduct.productUrl && (
                      <a
                        href={quickViewProduct.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm ${
                          quickViewProduct.provider === "Amazon"
                            ? "bg-[#FF9900] text-black hover:opacity-90"
                            : quickViewProduct.provider === "Flipkart"
                            ? "bg-[#2874F0] text-white hover:opacity-90"
                            : "bg-[var(--primary)] text-white hover:opacity-90"
                        }`}
                      >
                        {quickViewProduct.provider === "Local" ? "View Product" : `Buy on ${quickViewProduct.provider}`}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isAddingToWardrobe}
                      onClick={() => handleAddToWardrobe(quickViewProduct)}
                      className="px-4 rounded-xl"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5" /> Catalog in Wardrobe
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
